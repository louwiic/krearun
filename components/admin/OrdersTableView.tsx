"use client";

import Link from "next/link";
import { flexRender, type Table } from "@tanstack/react-table";
import type { ReactNode } from "react";
import type { Order } from "@/lib/types";
import { DEFAULT_ORDER_COLUMNS } from "@/lib/order-table";
import {
  ORDER_SOURCES,
  PRODUCTION_STATUSES,
  productionStatus,
  remainingCents,
} from "@/lib/order-management";
import { formatPrice } from "@/lib/format";
import { formatOrderDate } from "@/lib/order-details";
import { productionStatusStyle } from "@/lib/order-status-style";
import OrderItems from "./OrderItems";

type Props = {
  table: Table<Order>;
  orders: Order[];
  selected: string[];
  allChecked: boolean;
  pending: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onSelectPage: (checked: boolean) => void;
  onOpen: (order: Order) => void;
  save: (data: FormData) => void;
  renderPayment: (order: Order) => ReactNode;
};
const button =
  "rounded-full border border-sand bg-cream px-3 py-2 text-sm font-semibold hover:bg-linen";

export default function OrdersTableView({
  table,
  orders,
  selected,
  allChecked,
  pending,
  onSelect,
  onSelectPage,
  onOpen,
  save,
  renderPayment,
}: Props) {
  const sort = table.getState().sorting[0];
  const sortable = table
    .getAllLeafColumns()
    .filter((column) => column.getCanSort());
  const label = (id: string) =>
    String(table.getColumn(id)?.columnDef.header ?? id);
  function renderCell(id: string, order: Order): ReactNode {
    switch (id) {
      case "selection":
        return (
          <input
            type="checkbox"
            aria-label={`Sélectionner la commande ${order.number}`}
            checked={selected.includes(order.id)}
            onChange={(event) => onSelect(order.id, event.target.checked)}
          />
        );
      case "number":
        return (
          <Link
            href={`/admin/commandes/${order.id}`}
            className="font-semibold underline"
          >
            #{order.number}
          </Link>
        );
      case "orderedAt":
        return (
          <span className="whitespace-nowrap">
            {formatOrderDate(order.orderedAt)}
          </span>
        );
      case "client":
        return (
          <div className="min-w-40 max-w-56 break-words">
            <Link
              href={`/admin/commandes/${order.id}`}
              className="font-bold hover:text-terra"
            >
              {order.name || "Sans nom"}
            </Link>
            <p className="mt-1 text-xs text-ink-soft">{order.phone}</p>
            <p className="text-xs text-ink-soft">{order.city}</p>
            <p className="mt-2 text-xs text-ink-faint">
              {
                ORDER_SOURCES.find((source) => source.value === order.source)
                  ?.label
              }
            </p>
          </div>
        );
      case "details":
        return (
          <div className="min-w-72 max-w-md space-y-3 whitespace-normal break-words">
            {order.description && (
              <p className="whitespace-pre-wrap">{order.description}</p>
            )}
            <OrderItems items={order.items} compact />
            {!order.items.length && !order.description && (
              <p className="text-ink-soft">Non renseignée</p>
            )}
            {order.quantityText && (
              <p className="text-xs font-semibold">
                Quantité : {order.quantityText}
              </p>
            )}
            {order.urgent && (
              <span className="inline-block rounded-full bg-blush px-2 py-1 text-xs font-bold">
                Urgent
              </span>
            )}
            {order.dueDate && (
              <p className="text-xs text-terra-deep">
                À prévoir : {formatOrderDate(order.dueDate)}
              </p>
            )}
            {!!order.tags.length && (
              <p className="text-xs text-ink-faint">{order.tags.join(" · ")}</p>
            )}
            {(order.note || order.internalNote) && (
              <p className="text-xs text-ink-soft">
                {[
                  order.note && "Note client",
                  order.internalNote && "Notes internes",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <button
              type="button"
              onClick={() => onOpen(order)}
              aria-label={`Afficher tous les détails de la commande ${order.number}`}
              className="inline-flex rounded-full border border-terra/40 bg-cream px-3 py-2 text-xs font-semibold text-terra-deep hover:bg-linen"
            >
              Voir tous les détails ↗
            </button>
          </div>
        );
      case "production":
        return (
          <select
            aria-label={`Production de la commande ${order.number}`}
            disabled={pending}
            value={productionStatus(order.status)}
            onChange={(event) => {
              const data = new FormData();
              data.set("id", order.id);
              data.set("updatedAt", order.updatedAt);
              data.set("kind", "production");
              data.set("value", event.target.value);
              save(data);
            }}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold outline-none focus:border-terra disabled:cursor-not-allowed disabled:opacity-100 ${productionStatusStyle(order.status)}`}
          >
            {PRODUCTION_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        );
      case "payment":
        return renderPayment(order);
      case "amountPaidCents":
        return (
          <span className="whitespace-nowrap text-emerald-800">
            {formatPrice(order.amountPaidCents)}
          </span>
        );
      case "totalCents":
        return (
          <span className="whitespace-nowrap font-bold">
            {formatPrice(order.totalCents)}
          </span>
        );
      case "remaining":
        return (
          <span
            className={`whitespace-nowrap ${remainingCents(order) ? "font-bold text-terra-deep" : "text-ink-faint"}`}
          >
            {formatPrice(remainingCents(order))}
          </span>
        );
      case "source":
        return ORDER_SOURCES.find((source) => source.value === order.source)
          ?.label;
      case "quantity":
        return (
          order.quantityText ||
          order.items.reduce((sum, item) => sum + item.quantity, 0) ||
          "—"
        );
      case "dueDate":
        return formatOrderDate(order.dueDate);
      case "updatedAt":
        return formatOrderDate(order.updatedAt, true);
      case "phone":
        return <span className="whitespace-nowrap">{order.phone || "—"}</span>;
      case "email":
        return (
          <span className="block min-w-40 max-w-64 break-all">
            {order.email || "—"}
          </span>
        );
      case "city":
        return <span className="block min-w-28">{order.city || "—"}</span>;
      case "trackingNumber":
        return order.trackingNumber || "—";
      case "actions":
        return (
          <div className="space-y-3 text-xs">
            <button
              type="button"
              onClick={() => onOpen(order)}
              className="block font-semibold text-terra-deep underline"
            >
              Afficher tout
            </button>
            <Link
              href={`/admin/commandes/${order.id}/modifier`}
              className="block font-semibold underline"
            >
              Modifier
            </Link>
            <Link
              href={`/admin/commandes/${order.id}`}
              className="block underline"
            >
              Fiche complète
            </Link>
          </div>
        );
      default:
        return "—";
    }
  }

  return (
    <section
      className="crm-surface space-y-3"
      aria-label="Tableau complet des commandes"
    >
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-sand bg-cream p-4 text-sm">
        <label className="flex items-center gap-2 font-semibold">
          Trier par
          <select
            aria-label="Colonne de tri"
            value={sort?.id ?? "orderedAt"}
            onChange={(event) =>
              table.setSorting([
                { id: event.target.value, desc: sort?.desc ?? false },
              ])
            }
            className="rounded-xl border border-sand bg-cream px-3 py-2 font-normal"
          >
            {sortable.map((column) => (
              <option key={column.id} value={column.id}>
                {label(column.id)}
              </option>
            ))}
          </select>
        </label>
        <select
          aria-label="Sens du tri"
          value={sort?.desc ? "desc" : "asc"}
          onChange={(event) =>
            table.setSorting([
              {
                id: sort?.id ?? "orderedAt",
                desc: event.target.value === "desc",
              },
            ])
          }
          className="rounded-xl border border-sand bg-cream px-3 py-2"
        >
          <option value="asc">ASC ↑ Croissant</option>
          <option value="desc">DESC ↓ Décroissant</option>
        </select>
        <button
          type="button"
          onClick={() => table.setSorting([{ id: "orderedAt", desc: true }])}
          className={button}
        >
          Plus récentes d’abord
        </button>
        <details className="relative ml-auto">
          <summary className={`${button} cursor-pointer`}>
            Colonnes ({table.getVisibleLeafColumns().length - 2})
          </summary>
          <div className="absolute right-0 z-30 mt-2 max-h-96 w-72 overflow-y-auto rounded-xl border border-sand bg-cream p-3 shadow-soft">
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => table.toggleAllColumnsVisible(true)}
                className="p-1 text-xs underline"
              >
                Tout afficher
              </button>
              <button
                type="button"
                onClick={() =>
                  table.setColumnVisibility({ ...DEFAULT_ORDER_COLUMNS })
                }
                className="p-1 text-xs underline"
              >
                Vue par défaut
              </button>
            </div>
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <label
                  key={column.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-linen"
                >
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                  />
                  {label(column.id)}
                </label>
              ))}
          </div>
        </details>
        <p className="w-full text-xs text-ink-soft">
          Clique sur un en-tête pour trier ASC / DESC. Maj + clic ajoute un
          second critère. Le tri porte sur tous les résultats, avant la
          pagination.
        </p>
        <p className="w-full text-xs font-semibold" aria-live="polite">
          Tri :{" "}
          {table
            .getState()
            .sorting.map(
              (item) => `${label(item.id)} ${item.desc ? "DESC ↓" : "ASC ↑"}`,
            )
            .join(" · ")}
        </p>
      </div>
      <div
        className="max-h-[72vh] overflow-auto rounded-2xl border border-sand bg-cream shadow-soft"
        tabIndex={0}
        role="region"
        aria-label="Commandes — défilement horizontal et vertical"
      >
        <table className="crm-table crm-table-zebra crm-table-pin-rows min-w-[1320px] text-left text-sm">
          <caption className="sr-only">
            Commandes filtrées, triées et paginées. Chaque ligne permet d’ouvrir
            tous ses détails.
          </caption>
          <thead className="text-xs uppercase text-ink-soft">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className="bg-cream px-3 py-4"
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : undefined
                    }
                  >
                    {header.column.id === "selection" ? (
                      <input
                        type="checkbox"
                        aria-label="Sélectionner les commandes de cette page"
                        checked={allChecked}
                        onChange={(event) => onSelectPage(event.target.checked)}
                      />
                    ) : header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-2 whitespace-nowrap rounded-md px-1 py-1 text-left hover:text-terra-deep focus-visible:outline-2"
                        aria-label={`Trier ${label(header.column.id)} ${header.column.getNextSortingOrder() === "desc" ? "DESC décroissant" : "ASC croissant"}`}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <span aria-hidden="true">
                          {header.column.getIsSorted() === "asc"
                            ? "↑ ASC"
                            : header.column.getIsSorted() === "desc"
                              ? "↓ DESC"
                              : "↕"}
                        </span>
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className={`border-t border-sand/70 align-top ${selected.includes(order.id) ? "bg-lavande/15" : ""}`}
              >
                {table
                  .getRow(order.id)
                  .getVisibleCells()
                  .map((cell) => (
                    <td key={cell.id} className="px-3 py-4 align-top">
                      {renderCell(cell.column.id, order)}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && (
          <p className="p-10 text-center text-sm text-ink-soft">
            Aucune commande ne correspond aux filtres. Réinitialise-les ou
            ajoute une commande manuelle.
          </p>
        )}
      </div>
    </section>
  );
}
