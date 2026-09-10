import type { Order, OrderItem } from "./types";

export function orderItemDetails(item: OrderItem) {
  return [
    { label: "Modèle", value: item.variantName },
    { label: "Coloris", value: item.color },
    { label: "Prénom / personnalisation", value: item.customName },
    { label: "Porte-clés offert", value: item.keychainChoice },
  ].filter((entry): entry is { label: string; value: string } =>
    Boolean(entry.value),
  );
}

export function orderDescriptionText(
  order: Pick<Order, "description" | "items">,
): string {
  return [
    order.description,
    ...order.items.map((item) =>
      [
        `${item.quantity} × ${item.name}`,
        ...orderItemDetails(item).map(
          (detail) => `${detail.label} : ${detail.value}`,
        ),
      ].join(" · "),
    ),
  ]
    .filter(Boolean)
    .join("\n");
}

export function orderSearchText(order: Order): string {
  return [
    order.number,
    order.name,
    order.email,
    order.phone,
    order.city,
    order.addressLine1,
    order.addressLine2,
    order.postalCode,
    order.country,
    orderDescriptionText(order),
    order.quantityText,
    order.note,
    order.internalNote,
    order.trackingNumber,
    order.sourceId,
    ...order.tags,
  ].join(" ");
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Indian/Reunion",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Indian/Reunion",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
export function formatOrderDate(value: string, withTime = false): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? (withTime ? dateTimeFormatter : dateFormatter).format(date)
    : "—";
}
