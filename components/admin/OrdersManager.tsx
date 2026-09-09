"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  bulkProductionAction,
  importCrmOrdersAction,
  quickOrderAction,
  type OrderActionResult,
} from "@/app/admin/order-actions";
import {
  csvCell,
  ORDER_SOURCES,
  PAYMENT_STATUSES,
  PRODUCTION_STATUSES,
  productionStatus,
  remainingCents,
} from "@/lib/order-management";
import { formatDate, formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";
import {
  paymentStatusStyle,
  productionStatusStyle,
} from "@/lib/order-status-style";
import {
  matchesOrderDate,
  matchesSelectedStatus,
  orderDateKey,
  paginateRows,
  togglePageSelection,
  toggleStatusFilter,
  type OrderDateFilter,
} from "@/lib/order-list";

const fieldBase =
  "rounded-xl border px-3 py-2 text-sm outline-none focus:border-terra";
const field = `${fieldBase} border-sand bg-cream disabled:opacity-50`;
const statusField = `${fieldBase} font-semibold disabled:cursor-not-allowed disabled:opacity-100`;
const button =
  "rounded-full border border-sand bg-cream px-4 py-2 text-sm font-semibold hover:bg-linen disabled:opacity-50";
const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function StatusFilter({
  label,
  kind,
  options,
  selected,
  onChange,
}: {
  label: string;
  kind: "production" | "payment";
  options: readonly { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const summary = selected.length
    ? options
        .filter((option) => selected.includes(option.value))
        .map((option) => option.label)
        .join(", ")
    : "Tous les statuts";
  return (
    <div className="min-w-0 text-xs font-semibold">
      <span>{label}</span>
      <details
        className="relative mt-1"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }
        }}
      >
        <summary
          className={`${field} cursor-pointer select-none`}
          aria-label={`${label} : ${summary}`}
          title={summary}
        >
          {selected.length > 1
            ? `${selected.length} statuts sélectionnés`
            : summary}
        </summary>
        <fieldset className="absolute left-0 top-full z-20 mt-2 w-64 max-w-[calc(100vw-3rem)] rounded-xl border border-sand bg-cream p-3 shadow-soft">
          <legend className="sr-only">
            Filtrer par {label.toLowerCase()} — plusieurs choix possibles
          </legend>
          <button
            type="button"
            onClick={() => onChange([])}
            className="mb-2 w-full rounded-lg px-2 py-2 text-left text-sm underline hover:bg-linen"
          >
            Afficher tous les statuts
          </button>
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm font-normal hover:bg-linen"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={(event) =>
                  onChange(
                    toggleStatusFilter(
                      selected,
                      option.value,
                      event.target.checked,
                    ),
                  )
                }
              />
              <span
                className={`rounded-full border px-2 py-1 font-semibold ${kind === "production" ? productionStatusStyle(option.value) : paymentStatusStyle(option.value)}`}
              >
                {option.label}
              </span>
            </label>
          ))}
          <p className="mt-2 text-xs font-normal text-ink-soft">
            Plusieurs choix possibles. Aucun choix = tous.
          </p>
        </fieldset>
      </details>
      {selected.length > 1 && (
        <p className="mt-1 font-normal text-ink-soft">{summary}</p>
      )}
    </div>
  );
}

function PaymentEditor({
  order,
  disabled,
  save,
}: {
  order: Order;
  disabled: boolean;
  save: (data: FormData) => void;
}) {
  const [payment, setPayment] = useState(order.paymentStatus);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save(new FormData(event.currentTarget));
      }}
      className="flex min-w-36 flex-wrap gap-1.5"
    >
      <input type="hidden" name="id" value={order.id} />
      <input type="hidden" name="updatedAt" value={order.updatedAt} />
      <input type="hidden" name="kind" value="payment" />
      <select
        aria-label={`Paiement de la commande ${order.number}`}
        name="value"
        value={payment}
        onChange={(event) =>
          setPayment(event.target.value as Order["paymentStatus"])
        }
        disabled={disabled || order.source === "web"}
        className={`${statusField} w-full ${paymentStatusStyle(payment)}`}
      >
        {PAYMENT_STATUSES.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
      {payment === "deposit" && (
        <input
          aria-label={`Acompte en euros de la commande ${order.number}`}
          name="amountPaid"
          type="number"
          min="0"
          max={order.totalCents / 100}
          step="0.01"
          defaultValue={order.amountPaidCents / 100}
          disabled={disabled || order.source === "web"}
          className={`${field} w-24`}
        />
      )}
      {order.source !== "web" &&
        (payment !== order.paymentStatus || payment === "deposit") && (
          <button
            disabled={disabled}
            className="rounded-lg bg-ink px-2 py-1 text-xs font-bold text-cream"
          >
            Valider
          </button>
        )}
      {order.source === "web" && (
        <span className="text-xs text-ink-faint">Géré par Stripe</span>
      )}
    </form>
  );
}

function ImportPanel() {
  const [result, setResult] = useState<OrderActionResult>();
  const [pending, startTransition] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  function run(preview: boolean) {
    if (!form.current || (!preview && !form.current.reportValidity())) return;
    const data = new FormData(form.current);
    startTransition(async () => {
      try {
        setResult(await importCrmOrdersAction(data, preview));
      } catch {
        setResult({
          error:
            "Import interrompu. Vérifie la connexion. Relancer le même export ne crée pas de doublons.",
        });
      }
    });
  }
  return (
    <details className="rounded-2xl border border-sand bg-cream p-5">
      <summary className="cursor-pointer font-semibold">
        Importer les commandes de CRM STD
      </summary>
      <p className="mb-4 mt-3 text-sm text-ink-soft">
        Dans CRM STD, utilise « Export complet Krearun » pour récupérer toutes
        les commandes avec leurs dates et identifiants. Les anciens CSV sont
        aussi acceptés. Les commandes existantes ne seront ni écrasées ni
        notifiées.
      </p>
      <form
        ref={form}
        onSubmit={(event) => {
          event.preventDefault();
          run(false);
        }}
        className="space-y-3"
      >
        <label className="block text-sm font-semibold">
          Export JSON ou CSV (5 Mo maximum, 2 000 commandes)
          <input
            name="file"
            type="file"
            accept=".json,.csv,application/json,text/csv"
            required
            disabled={pending}
            onChange={() => setResult(undefined)}
            className="mt-2 block max-w-full text-sm"
          />
        </label>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(true)}
          className={button}
        >
          {pending ? "Traitement…" : "Vérifier le fichier"}
        </button>
        {result && (
          <div
            role="status"
            className={`rounded-xl p-4 text-sm ${result.error ? "bg-blush/30" : "bg-sage/20"}`}
          >
            <p>{result.error || result.message}</p>
            {result.created !== undefined && (
              <p className="mt-2 font-semibold">
                {result.created} commande(s){" "}
                {result.preview ? "à importer" : "importée(s)"} ·{" "}
                {result.skipped ?? 0} déjà présente(s)
                {result.totalCents !== undefined &&
                  ` · Total du fichier : ${formatPrice(result.totalCents)}`}
              </p>
            )}
            {!!result.warnings?.length && (
              <details className="mt-2">
                <summary>{result.warnings.length} point(s) à vérifier</summary>
                <ul className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  {result.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
        {result?.preview && !result.error && !!result.created && (
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="confirm"
                required
                disabled={pending}
              />{" "}
              J’ai vérifié l’aperçu et les avertissements.
            </label>
            <button
              disabled={pending}
              className="rounded-full bg-ink px-5 py-2 text-sm font-bold text-cream"
            >
              Confirmer l’import
            </button>
          </div>
        )}
      </form>
    </details>
  );
}

export default function OrdersManager({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [payments, setPayments] = useState<string[]>([]);
  const [source, setSource] = useState("");
  const [month, setMonth] = useState("");
  const [dateMode, setDateMode] = useState<OrderDateFilter["mode"]>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [urgent, setUrgent] = useState(false);
  const [unsettled, setUnsettled] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulk, setBulk] = useState("ready");
  const [notice, setNotice] = useState<OrderActionResult>();
  const [pending, startTransition] = useTransition();
  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const haystack = normalize(
          [
            order.number,
            order.name,
            order.email,
            order.phone,
            order.city,
            order.description,
            order.internalNote,
            ...order.tags,
            ...order.items.map((item) => item.name),
          ].join(" "),
        );
        return (
          (!search || haystack.includes(normalize(search))) &&
          matchesSelectedStatus(productionStatus(order.status), statuses) &&
          matchesSelectedStatus(order.paymentStatus, payments) &&
          (!source || order.source === source) &&
          matchesOrderDate(order.orderedAt, {
            mode: dateMode,
            month,
            from: dateFrom,
            to: dateTo,
          }) &&
          (!urgent || order.urgent) &&
          (!unsettled || remainingCents(order) > 0)
        );
      }),
    [
      orders,
      search,
      statuses,
      payments,
      source,
      month,
      dateMode,
      dateFrom,
      dateTo,
      urgent,
      unsettled,
    ],
  );
  const pagination = paginateRows(filtered, page, pageSize);
  const currentPageIds = pagination.items.map((order) => order.id);
  const invalidDateRange =
    dateMode === "range" && !!dateFrom && !!dateTo && dateFrom > dateTo;
  function resetPage() {
    setPage(1);
    setSelected([]);
  }
  const active = filtered.filter((order) => order.status !== "cancelled");
  const selectedVisible = filtered.filter((order) =>
    selected.includes(order.id),
  );
  const allChecked =
    !!pagination.items.length &&
    pagination.items.every((order) => selected.includes(order.id));
  const stats = [
    { label: "Commandes trouvées", value: String(filtered.length) },
    {
      label: "Prêtes",
      value: String(
        filtered.filter((order) => order.status === "ready").length,
      ),
    },
    {
      label: "Total hors annulations",
      value: formatPrice(
        active.reduce((sum, order) => sum + order.totalCents, 0),
      ),
    },
    {
      label: "Encaissé hors annulations",
      value: formatPrice(
        active.reduce((sum, order) => sum + order.amountPaidCents, 0),
      ),
    },
    {
      label: "Reste à payer",
      value: formatPrice(
        filtered.reduce((sum, order) => sum + remainingCents(order), 0),
      ),
    },
  ];
  function save(data: FormData) {
    startTransition(async () => {
      try {
        setNotice(await quickOrderAction(data));
      } catch {
        setNotice({
          error:
            "Modification non confirmée. Actualise la liste avant de réessayer.",
        });
      }
    });
  }
  function exportCsv() {
    const exporting = selectedVisible.length ? selectedVisible : filtered;
    const headers = [
      "Numéro",
      "Source",
      "ID source",
      "Date",
      "Client",
      "Email",
      "Téléphone",
      "Ville",
      "Produits",
      "Quantité",
      "Production",
      "Paiement",
      "Total EUR",
      "Encaissé EUR",
      "Reste EUR",
      "Échéance",
      "Urgent",
      "Tags",
      "Notes internes",
      "Lien profil",
      "Lien produit",
    ];
    const rows = exporting.map((order) => [
      order.number,
      order.source,
      order.sourceId,
      order.orderedAt,
      order.name,
      order.email,
      order.phone,
      order.city,
      order.description ||
        order.items.map((item) => `${item.quantity} × ${item.name}`).join("\n"),
      order.quantityText,
      PRODUCTION_STATUSES.find(
        (status) => status.value === productionStatus(order.status),
      )?.label,
      PAYMENT_STATUSES.find((status) => status.value === order.paymentStatus)
        ?.label,
      (order.totalCents / 100).toFixed(2),
      (order.amountPaidCents / 100).toFixed(2),
      (remainingCents(order) / 100).toFixed(2),
      order.dueDate,
      order.urgent ? "oui" : "non",
      order.tags.join(", "),
      order.internalNote,
      order.customerProfileUrl,
      order.productUrl,
    ]);
    const blob = new Blob(
      [
        "\uFEFF" +
          [headers, ...rows]
            .map((row) => row.map(csvCell).join(";"))
            .join("\r\n"),
      ],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob),
      anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `krearun-commandes-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  function paginationControls(position: string) {
    return (
      <nav
        aria-label={`Pagination des commandes — ${position}`}
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
      >
        <p aria-live="polite">
          {pagination.start}–{pagination.end} sur {pagination.total} commande(s)
        </p>
        <label className="flex items-center gap-2">
          Par page
          <select
            aria-label={`Commandes par page — ${position}`}
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className={field}
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(1)}
            disabled={pagination.page === 1}
            className={button}
            aria-label="Première page"
          >
            «
          </button>
          <button
            type="button"
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={button}
          >
            Précédente
          </button>
          <span className="px-1">
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className={button}
          >
            Suivante
          </button>
          <button
            type="button"
            onClick={() => setPage(pagination.totalPages)}
            disabled={pagination.page === pagination.totalPages}
            className={button}
            aria-label="Dernière page"
          >
            »
          </button>
        </div>
      </nav>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Commandes</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Boutique, commandes manuelles et CRM STD réunis. Production et
            paiement suivis séparément.
          </p>
        </div>
        <Link
          href="/admin/commandes/nouvelle"
          className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream hover:bg-terra"
        >
          + Commande manuelle
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-cream p-5 shadow-soft"
          >
            <p className="font-display text-2xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-xs text-ink-soft">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-cream p-5 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="text-xs font-semibold sm:col-span-2 xl:col-span-1">
            Rechercher
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                resetPage();
              }}
              placeholder="Client, téléphone, produit…"
              className={`${field} mt-1 w-full`}
              type="search"
            />
          </label>
          <StatusFilter
            label="Production"
            kind="production"
            options={PRODUCTION_STATUSES}
            selected={statuses}
            onChange={(values) => {
              setStatuses(values);
              resetPage();
            }}
          />
          <StatusFilter
            label="Paiement"
            kind="payment"
            options={PAYMENT_STATUSES}
            selected={payments}
            onChange={(values) => {
              setPayments(values);
              resetPage();
            }}
          />
          <label className="text-xs font-semibold">
            Origine
            <select
              value={source}
              onChange={(event) => {
                setSource(event.target.value);
                resetPage();
              }}
              className={`${field} mt-1 w-full`}
            >
              <option value="">Toutes les origines</option>
              {ORDER_SOURCES.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Période de commande
            <select
              value={dateMode}
              onChange={(event) => {
                setDateMode(event.target.value as OrderDateFilter["mode"]);
                resetPage();
              }}
              className={`${field} mt-1 w-full`}
            >
              <option value="all">Toutes les dates</option>
              <option value="month">Par mois</option>
              <option value="range">Entre deux dates</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          {dateMode === "month" && (
            <label className="text-xs font-semibold">
              Mois de commande
              <input
                type="month"
                value={month}
                onChange={(event) => {
                  setMonth(event.target.value);
                  resetPage();
                }}
                className={`${field} mt-1 block`}
              />
            </label>
          )}
          {dateMode === "range" && (
            <>
              <label className="text-xs font-semibold">
                Du
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(event) => {
                    setDateFrom(event.target.value);
                    resetPage();
                  }}
                  className={`${field} mt-1 block`}
                />
              </label>
              <label className="text-xs font-semibold">
                Au (inclus)
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(event) => {
                    setDateTo(event.target.value);
                    resetPage();
                  }}
                  className={`${field} mt-1 block`}
                />
              </label>
            </>
          )}
          <button
            type="button"
            className={button}
            onClick={() => {
              const today = orderDateKey(new Date());
              setDateMode("range");
              setDateFrom(today);
              setDateTo(today);
              resetPage();
            }}
          >
            Aujourd’hui
          </button>
          <button
            type="button"
            className={button}
            onClick={() => {
              setDateMode("month");
              setMonth(orderDateKey(new Date()).slice(0, 7));
              resetPage();
            }}
          >
            Ce mois-ci
          </button>
          {dateMode !== "all" && (
            <span className="self-center text-xs text-ink-soft">
              Dates à l’heure de La Réunion.
            </span>
          )}
        </div>
        {invalidDateRange && (
          <p role="alert" className="mt-2 text-sm text-terra-deep">
            La date de début doit précéder ou être égale à la date de fin.
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={urgent}
              onChange={(event) => {
                setUrgent(event.target.checked);
                resetPage();
              }}
            />{" "}
            Urgentes
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={unsettled}
              onChange={(event) => {
                setUnsettled(event.target.checked);
                resetPage();
              }}
            />{" "}
            Reste à payer
          </label>
          <button
            onClick={() => {
              setSearch("");
              setStatuses([]);
              setPayments([]);
              setSource("");
              setMonth("");
              setDateMode("all");
              setDateFrom("");
              setDateTo("");
              setPage(1);
              setUrgent(false);
              setUnsettled(false);
              setSelected([]);
            }}
            className="text-ink-soft underline"
          >
            Réinitialiser
          </button>
          <button
            onClick={exportCsv}
            disabled={!filtered.length}
            className={`${button} ml-auto`}
          >
            Exporter{" "}
            {selectedVisible.length
              ? `la sélection (${selectedVisible.length})`
              : `les résultats (${filtered.length})`}
          </button>
        </div>
      </div>
      <ImportPanel />
      {notice && (
        <p
          role="status"
          className={`rounded-xl px-4 py-3 text-sm ${notice.error ? "bg-blush/30" : "bg-sage/20"}`}
        >
          {notice.error || notice.message}
        </p>
      )}
      {!!selectedVisible.length && (
        <form
          className="flex flex-wrap items-center gap-3 rounded-xl bg-lavande/20 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const ids = selectedVisible.map((order) => order.id);
            startTransition(async () => {
              try {
                const result = await bulkProductionAction(ids, bulk);
                setNotice(result);
                if (!result.error) setSelected([]);
              } catch {
                setNotice({
                  error:
                    "Mise à jour interrompue. Actualise la liste pour vérifier les changements.",
                });
              }
            });
          }}
        >
          <span className="text-sm font-semibold">
            {selectedVisible.length} sélectionnée(s), toutes pages confondues
          </span>
          <select
            aria-label="Statut à appliquer à la sélection"
            value={bulk}
            onChange={(event) => setBulk(event.target.value)}
            disabled={pending}
            className={`${statusField} ${productionStatusStyle(bulk)}`}
          >
            {PRODUCTION_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <button
            disabled={pending || selectedVisible.length > 100}
            className={button}
          >
            Appliquer à la sélection
          </button>
          <span className="text-xs text-ink-soft">
            100 maximum · aucun e-mail envoyé
          </span>
        </form>
      )}
      {paginationControls("haut")}
      <div className="overflow-x-auto rounded-2xl bg-cream shadow-soft">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <caption className="sr-only">
            Commandes triées de la plus récente à la plus ancienne
          </caption>
          <thead className="border-b border-sand text-xs uppercase text-ink-soft">
            <tr>
              <th className="p-4">
                <input
                  type="checkbox"
                  aria-label="Sélectionner les commandes de cette page"
                  checked={allChecked}
                  onChange={(event) =>
                    setSelected((current) =>
                      togglePageSelection(
                        current,
                        currentPageIds,
                        event.target.checked,
                      ),
                    )
                  }
                />
              </th>
              {[
                "Client / ville",
                "Commande / quantité",
                "Production",
                "Paiement",
                "Encaissé",
                "Total",
                "Reste",
                "Actions",
              ].map((label) => (
                <th key={label} className="px-3 py-4">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagination.items.map((order) => (
              <tr
                key={order.id}
                className="border-b border-sand/40 align-top last:border-0 even:bg-linen/40"
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    aria-label={`Sélectionner la commande ${order.number}`}
                    checked={selected.includes(order.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, order.id]
                          : current.filter((id) => id !== order.id),
                      )
                    }
                  />
                </td>
                <td className="min-w-40 px-3 py-4">
                  <Link
                    href={`/admin/commandes/${order.id}`}
                    className="font-bold hover:text-terra"
                  >
                    {order.name || "Sans nom"}
                  </Link>
                  <p className="text-xs text-ink-soft">{order.phone}</p>
                  <p className="text-xs text-ink-soft">{order.city}</p>
                  <p className="mt-2 text-xs text-ink-faint">
                    #{order.number} ·{" "}
                    {orderDateKey(order.orderedAt)
                      .split("-")
                      .reverse()
                      .join("/")}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {
                      ORDER_SOURCES.find(
                        (source) => source.value === order.source,
                      )?.label
                    }
                  </p>
                </td>
                <td className="min-w-56 max-w-80 px-3 py-4">
                  <p className="whitespace-pre-line break-words">
                    {order.description ||
                      order.items
                        .map((item) => `${item.quantity} × ${item.name}`)
                        .join("\n") ||
                      "Non renseignée"}
                  </p>
                  {order.quantityText && (
                    <p className="mt-1 text-xs font-semibold">
                      Quantité : {order.quantityText}
                    </p>
                  )}
                  {order.urgent && (
                    <span className="mt-2 inline-block rounded-full bg-blush px-2 py-1 text-xs font-bold">
                      Urgent
                    </span>
                  )}
                  {order.dueDate && (
                    <p className="mt-1 text-xs text-terra-deep">
                      À prévoir : {formatDate(order.dueDate)}
                    </p>
                  )}
                  {!!order.tags.length && (
                    <p className="mt-1 text-xs text-ink-faint">
                      {order.tags.join(" · ")}
                    </p>
                  )}
                </td>
                <td className="px-3 py-4">
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
                    className={`${statusField} ${productionStatusStyle(order.status)}`}
                  >
                    {PRODUCTION_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-4">
                  <PaymentEditor
                    key={`${order.id}-${order.updatedAt}`}
                    order={order}
                    disabled={pending}
                    save={save}
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sage-deep">
                  {formatPrice(order.amountPaidCents)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 font-bold">
                  {formatPrice(order.totalCents)}
                </td>
                <td
                  className={`whitespace-nowrap px-3 py-4 ${remainingCents(order) ? "font-bold text-terra-deep" : "text-ink-faint"}`}
                >
                  {formatPrice(remainingCents(order))}
                </td>
                <td className="px-3 py-4">
                  <Link
                    href={`/admin/commandes/${order.id}/modifier`}
                    className="font-semibold text-terra hover:underline"
                  >
                    Modifier
                  </Link>
                  <Link
                    href={`/admin/commandes/${order.id}`}
                    className="mt-2 block text-xs underline"
                  >
                    Détails
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="p-12 text-center text-ink-soft">
            Aucune commande ne correspond aux filtres. Tu peux les réinitialiser
            ou ajouter une commande manuelle.
          </p>
        )}
      </div>
      {paginationControls("bas")}
    </div>
  );
}
