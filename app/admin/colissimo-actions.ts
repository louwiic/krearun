"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { buildColissimoRequest, ColissimoValidationError, type ColissimoInput } from "@/lib/colissimo";
import { colissimoConfig, callColissimo } from "@/lib/colissimo-server";
import { parseColissimoResponse, ColissimoRejectedError } from "@/lib/colissimo-response";
import { orderDateKey } from "@/lib/order-list";
import { getOrderById, getColissimoShipment, reserveColissimoShipment, saveColissimoShipment, releaseRejectedColissimoShipment, updateManagedOrder } from "@/lib/store";

export type ColissimoActionState = { error?: string; message?: string };
export async function createColissimoLabelAction(_previous: ColissimoActionState, data: FormData): Promise<ColissimoActionState> {
  if (!(await isAdmin())) return { error: "Connectez-vous à l’administration." };
  const id = String(data.get("id") || "");
  let reservationId = "";
  let stored = false;
  try {
    const config = colissimoConfig();
    if (config.missing.length) return { error: `Configuration manquante : ${config.missing.join(", ")}.` };
    const order = await getOrderById(id);
    if (!order) return { error: "Commande introuvable." };
    const existing = await getColissimoShipment(id);
    if (existing) {
      if (existing.state === "ready") {
        if (!order.trackingNumber) await updateManagedOrder(id, { trackingNumber: existing.parcelNumber });
        revalidatePath(`/admin/commandes/${id}`);
        revalidatePath("/admin/commandes");
        return { message: "L’étiquette existe déjà. Retrouvez-la dans les documents Colissimo." };
      }
      return { error: "Une demande existe déjà pour cette commande. Vérifiez son résultat dans Colissimo avant toute nouvelle tentative." };
    }
    if (String(data.get("updatedAt")) !== order.updatedAt) return { error: "La commande a changé. Rechargez la page pour vérifier les coordonnées." };
    const input: ColissimoInput = {
      productCode: String(data.get("productCode") || ""),
      weight: Number(data.get("weight")), depositDate: String(data.get("depositDate") || ""),
      format: String(data.get("format") || ""), customs: data.get("customs") === "on",
      articles: JSON.parse(String(data.get("articles") || "[]")),
      postage: Number(data.get("postage")), invoiceNumber: String(data.get("invoiceNumber") || "").trim(),
    };
    if (!Array.isArray(input.articles)) return { error: "Déclaration douanière invalide." };
    const payload = buildColissimoRequest(order, config.sender, input, orderDateKey(new Date()));
    const validation = await callColissimo(payload, true);
    await parseColissimoResponse(validation.body, validation.contentType, true);
    if (!validation.ok) throw new Error("Validation indisponible.");
    if (!config.live) return { message: "Validation Colissimo réussie. Mode test : aucun affranchissement, aucune étiquette créée et aucun email envoyé." };
    if (data.get("confirm") !== "on") return { error: "Confirmez la création de l’affranchissement réel." };
    const currentOrder = await getOrderById(id);
    if (!currentOrder || currentOrder.updatedAt !== order.updatedAt || currentOrder.trackingNumber || ["cancelled", "shipped", "delivered"].includes(currentOrder.status))
      return { error: "La commande a changé pendant la validation. Rechargez la page avant d’affranchir." };
    const reservation = await reserveColissimoShipment(id, input.productCode);
    reservationId = reservation.id;
    const response = await callColissimo(payload, false);
    // Keep the original response before parsing, so a successful purchase can be recovered.
    await saveColissimoShipment(reservationId, { rawResponse: response.body.toString("base64"), contentType: response.contentType });
    const result = await parseColissimoResponse(response.body, response.contentType);
    if (!response.ok) throw new Error("Réponse inattendue.");
    await saveColissimoShipment(reservationId, { state: "ready", ...result, rawResponse: "" });
    stored = true;
    await updateManagedOrder(id, { trackingNumber: result.parcelNumber });
    revalidatePath(`/admin/commandes/${id}`);
    revalidatePath("/admin/commandes");
    return { message: "Étiquette créée et suivi enregistré. Téléchargez les documents ci-dessous. Passez la commande en « Expédiée » lors du dépôt du colis." };
  } catch (error) {
    if (reservationId && !stored) {
      if (error instanceof ColissimoRejectedError) await releaseRejectedColissimoShipment(reservationId).catch(() => undefined);
      else await saveColissimoShipment(reservationId, { state: "uncertain" }).catch(() => undefined);
    }
    revalidatePath(`/admin/commandes/${id}`);
    if (stored) return { error: "L’étiquette est enregistrée, mais le suivi n’a pas pu être recopié dans la commande. Rechargez la page et utilisez « Rattacher le suivi ». Ne créez pas un nouvel affranchissement." };
    if (error instanceof ColissimoValidationError || error instanceof ColissimoRejectedError) return { error: error.message };
    return { error: reservationId
      ? "Résultat de l’affranchissement incertain. La relance est bloquée pour éviter un doublon. Vérifiez la commande dans Colissimo avant de reprendre."
      : "Colissimo ou son stockage est indisponible. Vérifiez la configuration et la migration du stockage, puis réessayez." };
  }
}

export async function attachColissimoTrackingAction(_previous: ColissimoActionState, data: FormData): Promise<ColissimoActionState> {
  if (!(await isAdmin())) return { error: "Connectez-vous à l’administration." };
  const id = String(data.get("id") || "");
  try {
    const order = await getOrderById(id);
    const shipment = await getColissimoShipment(id);
    if (!order || shipment?.state !== "ready") return { error: "Aucune étiquette disponible." };
    if (order.trackingNumber && order.trackingNumber !== shipment.parcelNumber) return { error: "Un autre suivi est déjà renseigné. Vérifiez la commande." };
    await updateManagedOrder(id, { trackingNumber: shipment.parcelNumber });
    revalidatePath(`/admin/commandes/${id}`);
    revalidatePath("/admin/commandes");
    return { message: "Suivi rattaché à la commande." };
  } catch { return { error: "Le suivi n’a pas pu être enregistré." }; }
}

export async function recoverColissimoLabelAction(_previous: ColissimoActionState, data: FormData): Promise<ColissimoActionState> {
  if (!(await isAdmin())) return { error: "Connectez-vous à l’administration." };
  const id = String(data.get("id") || "");
  try {
    const order = await getOrderById(id);
    const shipment = await getColissimoShipment(id);
    if (!order || !shipment?.rawResponse || shipment.state === "ready") return { error: "Aucune réponse à récupérer. Vérifiez le résultat directement dans Colissimo." };
    // Avoid racing the original request while it may still be completing.
    if (!shipment.created || Date.now() - new Date(shipment.created).getTime() < 120000) return { error: "Attendez deux minutes après la demande avant de récupérer sa réponse." };
    const result = await parseColissimoResponse(Buffer.from(shipment.rawResponse, "base64"), shipment.contentType || "");
    await saveColissimoShipment(shipment.id, { ...result, state: "ready", rawResponse: "" });
    if (!order.trackingNumber) await updateManagedOrder(id, { trackingNumber: result.parcelNumber });
    revalidatePath(`/admin/commandes/${id}`);
    revalidatePath("/admin/commandes");
    return { message: "Étiquette récupérée depuis la réponse enregistrée. Aucun nouvel affranchissement créé." };
  } catch {
    revalidatePath(`/admin/commandes/${id}`);
    return { error: "La récupération n’a pas abouti. Vérifiez la référence de commande dans Colissimo ; la relance reste bloquée." };
  }
}
