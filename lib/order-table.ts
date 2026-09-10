import type {
  ColumnDef,
  SortingFn,
  VisibilityState,
} from "@tanstack/react-table";
import type { Order } from "./types";
import {
  ORDER_SOURCES,
  PAYMENT_STATUSES,
  PRODUCTION_STATUSES,
  productionStatus,
  remainingCents,
} from "./order-management";
import { orderDescriptionText } from "./order-details";

const collator = new Intl.Collator("fr", {
  sensitivity: "base",
  numeric: true,
});
const frenchSort: SortingFn<Order> = (a, b, column) =>
  collator.compare(
    String(a.getValue(column) ?? ""),
    String(b.getValue(column) ?? ""),
  );
const dateValue = (date: string) => {
  const value = Date.parse(date);
  return Number.isFinite(value) ? value : undefined;
};

export const ORDER_TABLE_COLUMNS: ColumnDef<Order>[] = [
  {
    id: "selection",
    header: "Sélection",
    enableSorting: false,
    enableHiding: false,
  },
  { id: "number", header: "N°", accessorKey: "number", sortingFn: "basic" },
  {
    id: "orderedAt",
    header: "Date",
    accessorFn: (order) => dateValue(order.orderedAt),
    sortingFn: "basic",
    sortUndefined: "last",
  },
  {
    id: "client",
    header: "Client / ville",
    accessorKey: "name",
    sortingFn: frenchSort,
  },
  {
    id: "details",
    header: "Commande / quantité",
    accessorFn: orderDescriptionText,
    sortingFn: frenchSort,
    enableHiding: false,
  },
  {
    id: "production",
    header: "Production",
    accessorFn: (order) =>
      PRODUCTION_STATUSES.find(
        (s) => s.value === productionStatus(order.status),
      )?.label,
    sortingFn: frenchSort,
  },
  {
    id: "payment",
    header: "Paiement",
    accessorFn: (order) =>
      PAYMENT_STATUSES.find((s) => s.value === order.paymentStatus)?.label,
    sortingFn: frenchSort,
  },
  {
    id: "amountPaidCents",
    header: "Encaissé",
    accessorKey: "amountPaidCents",
    sortingFn: "basic",
  },
  {
    id: "totalCents",
    header: "Total",
    accessorKey: "totalCents",
    sortingFn: "basic",
  },
  {
    id: "remaining",
    header: "Reste",
    accessorFn: remainingCents,
    sortingFn: "basic",
  },
  {
    id: "phone",
    header: "Téléphone",
    accessorKey: "phone",
    sortingFn: frenchSort,
  },
  {
    id: "email",
    header: "E-mail",
    accessorKey: "email",
    sortingFn: frenchSort,
  },
  { id: "city", header: "Ville", accessorKey: "city", sortingFn: frenchSort },
  {
    id: "source",
    header: "Origine",
    accessorFn: (order) =>
      ORDER_SOURCES.find((s) => s.value === order.source)?.label,
    sortingFn: frenchSort,
  },
  {
    id: "quantity",
    header: "Quantité",
    accessorFn: (order) =>
      order.quantityText ||
      String(order.items.reduce((sum, item) => sum + item.quantity, 0)),
    sortingFn: frenchSort,
  },
  {
    id: "dueDate",
    header: "Échéance",
    accessorFn: (order) => dateValue(order.dueDate),
    sortingFn: "basic",
    sortUndefined: "last",
  },
  {
    id: "updatedAt",
    header: "Mise à jour",
    accessorFn: (order) => dateValue(order.updatedAt),
    sortingFn: "basic",
    sortUndefined: "last",
  },
  {
    id: "trackingNumber",
    header: "Suivi colis",
    accessorKey: "trackingNumber",
    sortingFn: frenchSort,
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    enableHiding: false,
  },
];

export const DEFAULT_ORDER_COLUMNS: VisibilityState = {
  phone: false,
  email: false,
  city: false,
  source: false,
  quantity: false,
  dueDate: false,
  updatedAt: false,
  trackingNumber: false,
};
