import type { CreateOrderInput, Order, OrderStatus } from "./types";

export const PRODUCTION_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "À faire" },
  { value: "preparing", label: "En cours" },
  { value: "ready", label: "Prêt" },
  { value: "shipped", label: "Expédiée" },
  { value: "delivered", label: "Terminée / livrée" },
  { value: "cancelled", label: "Annulée" },
];
export const PAYMENT_STATUSES = [
  { value: "unpaid", label: "Non payé" },
  { value: "deposit", label: "Acompte" },
  { value: "paid", label: "Payé" },
  { value: "refunded", label: "Remboursé" },
] as const;
export const ORDER_SOURCES = [
  { value: "web", label: "Boutique" },
  { value: "manual", label: "Manuelle" },
  { value: "crm_std", label: "CRM STD" },
  { value: "csv", label: "Import CSV" },
] as const;

export function productionStatus(status: OrderStatus): OrderStatus {
  return status === "paid" ? "pending" : status;
}
export function isProductionStatus(value: string): value is OrderStatus {
  return PRODUCTION_STATUSES.some((status) => status.value === value);
}
export function isPaymentStatus(
  value: string,
): value is Order["paymentStatus"] {
  return PAYMENT_STATUSES.some((status) => status.value === value);
}
export function cents(value: unknown, label = "Montant"): number {
  const raw =
    typeof value === "number"
      ? value
      : String(value ?? "")
          .trim()
          .replace(/[\s€]/g, "")
          .replace(",", ".");
  if (raw === "") return 0;
  if (typeof raw === "string" && !/^\d+(\.\d{1,2})?$/.test(raw))
    throw new Error(`${label} : montant invalide.`);
  const number = Number(raw);
  if (!Number.isFinite(number) || number < 0 || number > 1_000_000)
    throw new Error(`${label} : montant invalide.`);
  return Math.round(number * 100);
}
export function paymentAmounts(
  total: number,
  amount: number,
  status: Order["paymentStatus"],
) {
  if (
    !Number.isSafeInteger(total) ||
    !Number.isSafeInteger(amount) ||
    total < 0 ||
    amount < 0 ||
    amount > total
  ) {
    throw new Error(
      "Le montant encaissé doit être compris entre 0 et le total.",
    );
  }
  const paid =
    status === "paid"
      ? total
      : status === "unpaid" || status === "refunded"
        ? 0
        : amount;
  return {
    amountPaidCents: paid,
    remainingCents: status === "refunded" ? 0 : total - paid,
  };
}
export function remainingCents(
  order: Pick<
    Order,
    "totalCents" | "amountPaidCents" | "paymentStatus" | "status"
  >,
) {
  if (order.status === "cancelled" || order.paymentStatus === "refunded")
    return 0;
  return Math.max(
    0,
    order.totalCents -
      (order.paymentStatus === "paid"
        ? order.totalCents
        : order.amountPaidCents),
  );
}
export function publicHttpUrl(raw: unknown): string {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return "";
    return url.toString();
  } catch {
    return "";
  }
}
export function isoDate(value: unknown, fallback = ""): string {
  if (!value) return fallback;
  let raw: unknown = value;
  if (typeof raw === "string" && raw.trim().startsWith("{")) {
    try {
      raw = JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
  if (typeof raw === "object" && raw !== null) {
    const timestamp = raw as { seconds?: number; _seconds?: number };
    const seconds = timestamp.seconds ?? timestamp._seconds;
    if (typeof seconds === "number") raw = seconds * 1000;
  }
  if (typeof raw === "string") {
    const timestamp = raw.match(
      /^Timestamp\(seconds=(\d+),\s*nanoseconds=\d+\)$/,
    );
    if (timestamp) raw = Number(timestamp[1]) * 1000;
  }
  if (typeof raw !== "string" && typeof raw !== "number") return fallback;
  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}
export function stringList(value: unknown): string[] {
  if (Array.isArray(value))
    return value
      .map(String)
      .map((v) => v.trim())
      .filter(Boolean);
  const raw = String(value ?? "").trim();
  if (raw.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return stringList(parsed);
    } catch {}
  }
  return raw
    .split(/[,\n]/)
    .map((v) => v.trim())
    .filter(Boolean);
}
export function normalizeLegacyStatus(value: unknown): OrderStatus {
  const status = String(value ?? "à faire")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const mapping: Record<string, OrderStatus> = {
    "a faire": "pending",
    pending: "pending",
    "en cours": "preparing",
    preparing: "preparing",
    pret: "ready",
    prete: "ready",
    ready: "ready",
    termine: "delivered",
    terminee: "delivered",
    livre: "delivered",
    livree: "delivered",
    delivered: "delivered",
    shipped: "shipped",
    expedie: "shipped",
    expediee: "shipped",
    cancelled: "cancelled",
    annule: "cancelled",
    annulee: "cancelled",
  };
  if (!mapping[status])
    throw new Error("Statut de production inconnu dans l'import.");
  return mapping[status];
}
export function normalizeLegacyPayment(value: unknown): Order["paymentStatus"] {
  const status = String(value ?? "non payé")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const mapping: Record<string, Order["paymentStatus"]> = {
    "non paye": "unpaid",
    unpaid: "unpaid",
    acompte: "deposit",
    deposit: "deposit",
    paye: "paid",
    paid: "paid",
    rembourse: "refunded",
    refunded: "refunded",
  };
  if (!mapping[status])
    throw new Error("Statut de paiement inconnu dans l'import.");
  return mapping[status];
}

// Quoted fields/newlines, escaped quotes, BOM and French semicolon exports.
export function parseCsv(input: string): Record<string, string>[] {
  if (input.length > 5_000_000) throw new Error("Le CSV dépasse 5 Mo.");
  const text = input.replace(/^\uFEFF/, "");
  const first = text.split(/\r?\n/, 1)[0];
  const separator =
    (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0)
      ? ";"
      : ",";
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (quoted || field.length === 0) quoted = !quoted;
      else field += ch;
    } else if (ch === separator && !quoted) {
      row.push(field);
      field = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (quoted) throw new Error("CSV invalide : guillemets non fermés.");
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  const headers = (rows.shift() ?? []).map((value) => value.trim());
  if (
    !headers.length ||
    headers.some((value) => !value) ||
    new Set(headers).size !== headers.length
  )
    throw new Error("En-têtes CSV invalides.");
  if (rows.length > 2000)
    throw new Error("Importer au maximum 2 000 commandes à la fois.");
  return rows.map((values) => {
    if (values.length !== headers.length)
      throw new Error("Une ligne CSV n'a pas le bon nombre de colonnes.");
    return Object.fromEntries(headers.map((header, i) => [header, values[i]]));
  });
}
export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function parseCrmExport(
  content: string,
  filename: string,
): Record<string, unknown>[] {
  if (content.length > 5_000_000) throw new Error("L'export dépasse 5 Mo.");
  if (filename.toLowerCase().endsWith(".csv")) return parseCsv(content);
  if (!filename.toLowerCase().endsWith(".json"))
    throw new Error("Choisis un export JSON ou CSV de CRM STD.");
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Le fichier JSON est invalide.");
  }
  if (parsed?.projectId && parsed.projectId !== "crm-std-ae027")
    throw new Error("Cet export ne provient pas du projet CRM STD attendu.");
  const rows = Array.isArray(parsed) ? parsed : parsed?.orders;
  if (
    !Array.isArray(rows) ||
    !rows.length ||
    rows.length > 2000 ||
    rows.some((row) => !row || typeof row !== "object" || Array.isArray(row))
  )
    throw new Error("L'export doit contenir de 1 à 2 000 commandes.");
  return rows;
}

export function legacyOrder(
  raw: Record<string, unknown>,
  sourceId: string,
  importedAt: string,
): {
  input: CreateOrderInput & {
    source: "crm_std";
    sourceId: string;
    amountPaidCents: number;
    legacyData: Record<string, unknown>;
  };
  warnings: string[];
} {
  const pick = (...keys: string[]) =>
    keys
      .map((key) => raw[key])
      .find((value) => value !== undefined && value !== null && value !== "");
  const str = (...keys: string[]) => String(pick(...keys) ?? "").trim();
  const name = str("client", "Client");
  if (!name) throw new Error("Nom du client manquant.");
  if (!sourceId || sourceId.length > 250)
    throw new Error("Identifiant source invalide.");
  const warnings: string[] = [];
  const totalCents = cents(pick("total", "Total"), "Total");
  const paymentStatus = normalizeLegacyPayment(
    pick(
      "statutPaiement",
      "status paiement",
      "statut paiement",
      "Statut paiement",
    ),
  );
  const deposit = cents(pick("acompte", "Acompte"), "Acompte");
  const amountPaidCents = paymentAmounts(
    totalCents,
    paymentStatus === "paid" ? totalCents : deposit,
    paymentStatus,
  ).amountPaidCents;
  const orderedAt = isoDate(pick("createdAt", "Date", "date"));
  if (!orderedAt)
    warnings.push(
      "Date absente ou illisible : date d'import utilisée, valeur originale conservée.",
    );
  const oldBalance = pick(
    "resteAPayer",
    "reste à payer",
    "reste a payer",
    "Reste à payer",
  );
  if (oldBalance !== undefined) {
    try {
      if (cents(oldBalance) !== totalCents - amountPaidCents)
        warnings.push(
          "Ancien reste à payer incohérent : recalculé depuis le total et le paiement.",
        );
    } catch {
      warnings.push("Ancien reste à payer illisible : recalculé.");
    }
  }
  const description = [
    stringList(pick("produits", "Produits")).join("\n"),
    str("infosCommande", "Infos commande", "infos commande"),
  ]
    .filter(Boolean)
    .join("\n\n");
  const internalNote = [
    str("commentaire", "Commentaire"),
    str("infosRelance", "infos relance", "Infos relance") &&
      `Relance : ${str("infosRelance", "infos relance", "Infos relance")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  if (
    name.length > 500 ||
    description.length > 20000 ||
    internalNote.length > 20000
  )
    throw new Error(
      "Un champ dépasse la longueur acceptée ; import interrompu pour éviter une troncature.",
    );
  const profile = str("lienProfil", "lien profil", "Lien profil");
  const product = str("lienProduit", "lien produit", "Lien produit");
  if (
    (profile && !publicHttpUrl(profile)) ||
    (product && !publicHttpUrl(product))
  )
    warnings.push(
      "Lien invalide conservé uniquement dans les données originales.",
    );
  return {
    input: {
      name,
      email: str("email", "Email").toLowerCase(),
      phone: str("telephone", "n° de téléphone", "Téléphone"),
      city: str("secteur", "Secteur", "ville", "Ville"),
      addressLine1: "",
      addressLine2: "",
      postalCode: "",
      country: "",
      subtotalCents: totalCents,
      shippingCents: 0,
      totalCents,
      status: normalizeLegacyStatus(pick("production", "Statut", "statut")),
      paymentStatus,
      amountPaidCents,
      note: "",
      internalNote,
      description,
      quantityText: str("quantite", "quantité", "Quantité", "Quantite"),
      items: [],
      stripeSessionId: "",
      trackingNumber: "",
      source: "crm_std",
      sourceId,
      orderedAt: orderedAt || importedAt,
      dueDate: "",
      tags: stringList(pick("tags", "Tags")),
      urgent: ["true", "oui", "1", "urgent"].includes(
        str("urgent", "Urgent").toLowerCase(),
      ),
      customerProfileUrl: publicHttpUrl(profile),
      productUrl: publicHttpUrl(product),
      legacyData: raw,
    },
    warnings,
  };
}
