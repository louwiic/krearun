import {
  sendCustomOrderEmail,
  sendOrderDelivered,
  sendOrderShipped,
} from "./email";
import type { Order } from "./types";

const labels: Record<Order["status"], string> = {
  review: "À vérifier",
  pending: "À faire",
  paid: "Payée",
  preparing: "En préparation",
  ready: "Prête",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export async function sendOrderStatusChanged(order: Order) {
  if (order.status === "shipped") return sendOrderShipped(order);
  if (order.status === "delivered") return sendOrderDelivered(order);

  const prenom = order.name.split(" ")[0] || "vous";
  return sendCustomOrderEmail(
    order,
    `Commande #${order.number} — ${labels[order.status]}`,
    `Bonjour ${prenom},

Le statut de votre commande #${order.number} a été mis à jour.

Nouveau statut : ${labels[order.status]}

Merci pour votre confiance ✿`,
  );
}
