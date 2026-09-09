"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import {
  createOrder,
  ensureOrderManagementSchema,
  getOrderById,
  getOrderBySourceId,
  updateManagedOrder,
} from "@/lib/store";
import {
  cents,
  isPaymentStatus,
  isProductionStatus,
  isoDate,
  legacyOrder,
  parseCrmExport,
  paymentAmounts,
  publicHttpUrl,
  stringList,
} from "@/lib/order-management";
import type { CreateOrderInput } from "@/lib/types";

export type OrderActionResult = {
  error?: string;
  message?: string;
  created?: number;
  skipped?: number;
  totalCents?: number;
  warnings?: string[];
  preview?: boolean;
};
async function authorize() {
  if (!(await isAdmin())) redirect("/admin/login");
}
function refresh() {
  revalidatePath("/admin");
  revalidatePath("/admin/commandes", "layout");
}
function text(data: FormData, key: string, max = 500) {
  const value = String(data.get(key) ?? "").trim();
  if (value.length > max)
    throw new Error(`Champ ${key} trop long (maximum ${max} caractères).`);
  return value;
}
function safeError(error: unknown) {
  // Validation errors may be displayed; transport/DB errors must not leak records or credentials.
  if (
    error instanceof Error &&
    !/PocketBase|fetch|ECONN|token|JSON|Unexpected/i.test(error.message)
  )
    return error.message;
  return "Enregistrement impossible. Vérifie la connexion et réessaie ; les données déjà enregistrées sont conservées.";
}

export async function saveManualOrderAction(
  _previous: OrderActionResult,
  data: FormData,
): Promise<OrderActionResult> {
  await authorize();
  let savedId = "";
  try {
    const id = text(data, "id");
    const previous = id ? await getOrderById(id) : null;
    if (id && !previous) throw new Error("Commande introuvable.");
    if (previous && text(data, "updatedAt") !== previous.updatedAt)
      throw new Error(
        "Cette commande a changé. Recharge la page avant de modifier.",
      );
    const name = text(data, "name");
    if (!name) throw new Error("Le nom du client est obligatoire.");
    const status = text(data, "status");
    if (!isProductionStatus(status))
      throw new Error("Statut de production invalide.");
    const email = text(data, "email", 320).toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("Adresse e-mail invalide.");
    const rawOrderedAt = text(data, "orderedAt");
    const orderedAt =
      previous?.orderedAt.startsWith(rawOrderedAt) && rawOrderedAt.length === 10
        ? previous.orderedAt
        : isoDate(rawOrderedAt);
    const rawDueDate = text(data, "dueDate");
    const dueDate = isoDate(rawDueDate);
    if (!orderedAt || (rawDueDate && !dueDate))
      throw new Error("Date invalide.");
    const profile = text(data, "customerProfileUrl", 2000),
      product = text(data, "productUrl", 2000);
    if (
      (profile && !publicHttpUrl(profile)) ||
      (product && !publicHttpUrl(product))
    )
      throw new Error("Les liens doivent commencer par http:// ou https://.");
    const web = previous?.source === "web";
    const totalCents = web
      ? previous.totalCents
      : cents(data.get("total"), "Total");
    const paymentStatus = web
      ? previous.paymentStatus
      : text(data, "paymentStatus");
    if (!isPaymentStatus(paymentStatus))
      throw new Error("Statut de paiement invalide.");
    const paid = web
      ? previous.amountPaidCents
      : paymentStatus === "paid"
        ? totalCents
        : cents(data.get("amountPaid"), "Montant encaissé");
    const input: CreateOrderInput = {
      name,
      email,
      phone: text(data, "phone"),
      city: text(data, "city"),
      addressLine1: text(data, "addressLine1"),
      addressLine2: text(data, "addressLine2"),
      postalCode: text(data, "postalCode", 50),
      country: text(data, "country", 100),
      totalCents,
      subtotalCents: web ? previous.subtotalCents : totalCents,
      shippingCents: web ? previous.shippingCents : 0,
      status,
      paymentStatus,
      amountPaidCents: paymentAmounts(totalCents, paid, paymentStatus)
        .amountPaidCents,
      description: text(data, "description", 20000),
      quantityText: text(data, "quantityText"),
      internalNote: text(data, "internalNote", 20000),
      note: previous?.note ?? "",
      customerProfileUrl: publicHttpUrl(profile),
      productUrl: publicHttpUrl(product),
      tags: stringList(text(data, "tags", 2000)),
      urgent: data.get("urgent") === "on",
      orderedAt,
      dueDate,
      items: previous?.items ?? [],
      source: previous?.source ?? "manual",
      sourceId: previous?.sourceId ?? "",
      stripeSessionId: previous?.stripeSessionId ?? "",
      trackingNumber: text(data, "trackingNumber"),
    };
    await ensureOrderManagementSchema();
    savedId = (
      id ? await updateManagedOrder(id, input) : await createOrder(input)
    ).id;
  } catch (error) {
    return { error: safeError(error) };
  }
  refresh();
  redirect(`/admin/commandes/${savedId}`);
}

export async function quickOrderAction(
  data: FormData,
): Promise<OrderActionResult> {
  await authorize();
  try {
    const order = await getOrderById(text(data, "id"));
    if (!order) throw new Error("Commande introuvable.");
    if (text(data, "updatedAt") !== order.updatedAt)
      throw new Error("Commande modifiée ailleurs. Actualise la liste.");
    const kind = text(data, "kind"),
      value = text(data, "value");
    let input: Partial<CreateOrderInput>;
    if (kind === "production" && isProductionStatus(value))
      input = {
        status: value,
        paymentStatus: order.paymentStatus,
        amountPaidCents: order.amountPaidCents,
      };
    else if (kind === "payment" && isPaymentStatus(value)) {
      if (order.source === "web")
        throw new Error("Les paiements boutique sont gérés par Stripe.");
      input = {
        paymentStatus: value,
        amountPaidCents: paymentAmounts(
          order.totalCents,
          value === "paid" ? order.totalCents : cents(data.get("amountPaid")),
          value,
        ).amountPaidCents,
      };
    } else throw new Error("Modification invalide.");
    await ensureOrderManagementSchema();
    await updateManagedOrder(order.id, input);
    refresh();
    return { message: "Commande mise à jour. Aucun e-mail envoyé." };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function bulkProductionAction(
  ids: string[],
  status: string,
): Promise<OrderActionResult> {
  await authorize();
  let updated = 0;
  try {
    if (
      !Array.isArray(ids) ||
      !ids.length ||
      ids.length > 100 ||
      !ids.every((id) => typeof id === "string" && /^[a-z0-9]{15}$/.test(id)) ||
      !isProductionStatus(status)
    )
      throw new Error("Sélection invalide (maximum 100 commandes).");
    const orders = await Promise.all([...new Set(ids)].map(getOrderById));
    if (orders.some((order) => !order))
      throw new Error("Une commande sélectionnée n'existe plus.");
    await ensureOrderManagementSchema();
    for (const order of orders) {
      if (!order) continue;
      await updateManagedOrder(order.id, {
        status,
        paymentStatus: order.paymentStatus,
        amountPaidCents: order.amountPaidCents,
      });
      updated++;
    }
    refresh();
    return {
      message: `${updated} commande(s) mise(s) à jour. Aucun e-mail envoyé.`,
    };
  } catch (error) {
    refresh();
    return {
      error: `${updated ? `${updated} modification(s) enregistrée(s). ` : ""}${safeError(error)}`,
    };
  }
}

export async function importCrmOrdersAction(
  data: FormData,
  dryRun: boolean,
): Promise<OrderActionResult> {
  await authorize();
  let created = 0,
    skipped = 0;
  try {
    if (
      typeof dryRun !== "boolean" ||
      (!dryRun && data.get("confirm") !== "on")
    )
      throw new Error("Confirme l'import après avoir vérifié l'aperçu.");
    const file = data.get("file");
    if (
      !(file instanceof File) ||
      !/\.(csv|json)$/i.test(file.name) ||
      file.size > 5_000_000
    )
      throw new Error(
        "Choisis un export JSON ou CSV CRM STD de moins de 5 Mo.",
      );
    const content = await file.text(),
      rows = parseCrmExport(content, file.name);
    if (!rows.length) throw new Error("L'export ne contient aucune commande.");
    const hash = createHash("sha256").update(content).digest("hex");
    const now = new Date().toISOString();
    const mapped = rows.map((row, i) => {
      try {
        return legacyOrder(row, String(row.id || `csv:${hash}:${i + 1}`), now);
      } catch (error) {
        throw new Error(`Ligne ${i + 1} : ${safeError(error)}`);
      }
    });
    if (new Set(mapped.map((row) => row.input.sourceId)).size !== mapped.length)
      throw new Error("Identifiants source en double dans l'export.");
    await ensureOrderManagementSchema();
    const pending = [];
    for (const row of mapped) {
      if (await getOrderBySourceId("crm_std", row.input.sourceId)) skipped++;
      else pending.push(row);
    }
    if (!dryRun) {
      for (const row of pending) {
        try {
          await createOrder(row.input);
          created++;
        } catch (error) {
          // A simultaneous or interrupted import may already have inserted this source ID.
          if (await getOrderBySourceId("crm_std", row.input.sourceId))
            skipped++;
          else throw error;
        }
      }
      refresh();
    }
    return {
      preview: dryRun,
      created: dryRun ? pending.length : created,
      skipped,
      totalCents: mapped.reduce((sum, row) => sum + row.input.totalCents, 0),
      warnings: mapped.flatMap((row, i) =>
        row.warnings.map((message) => `Ligne ${i + 1} : ${message}`),
      ),
      message: dryRun
        ? "Aperçu uniquement : aucune commande créée."
        : "Import terminé. Aucun e-mail envoyé, aucune commande existante écrasée.",
    };
  } catch (error) {
    if (created) refresh();
    return {
      created,
      skipped,
      error: `${created ? `${created} commande(s) importée(s) avant interruption. Tu peux relancer le même fichier sans doublon. ` : ""}${safeError(error)}`,
    };
  }
}
