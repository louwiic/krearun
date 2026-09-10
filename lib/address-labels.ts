import type { Order } from "./types";

export type AddressLabel = {
  id: string;
  number: number;
  name: string;
  lines: string[];
};
export type AddressLabelIssue = Pick<AddressLabel, "id" | "number" | "name"> & {
  reason: string;
};
export type AddressLabelSelection = {
  readyCount: number;
  labels: AddressLabel[];
  issues: AddressLabelIssue[];
};

function clean(value: string | undefined): string {
  return (value ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
}

function countryName(country: string): string {
  if (!country) return "";
  if (/^[a-z]{2}$/i.test(country)) {
    return new Intl.DisplayNames(["fr"], { type: "region" }).of(
      country.toUpperCase(),
    ) ?? country;
  }
  return country;
}

// Use all loaded orders, never only a filtered/paginated slice. No guesses from notes.
export function selectReadyAddressLabels(orders: Order[]): AddressLabelSelection {
  const result: AddressLabelSelection = { readyCount: 0, labels: [], issues: [] };
  const seen = new Set<string>();
  for (const order of orders) {
    if (order.status !== "ready" || seen.has(order.id)) continue;
    seen.add(order.id);
    result.readyCount += 1;
    const name = clean(order.name);
    const street = clean(order.addressLine1);
    const city = clean(order.city);
    const postalCode = clean(order.postalCode);
    const missing = [
      (!name || /^(client à renseigner|sans nom)$/i.test(name)) && "nom / prénom",
      !street && "numéro et voie",
      !postalCode && "code postal",
      !city && "ville",
    ].filter(Boolean);
    const identity = { id: order.id, number: order.number, name };
    if (missing.length) {
      result.issues.push({ ...identity, reason: `À compléter : ${missing.join(", ")}.` });
      continue;
    }
    result.labels.push({
      ...identity,
      lines: [
        street,
        clean(order.addressLine2),
        `${postalCode} ${city}`,
        countryName(clean(order.country)),
      ].filter(Boolean),
    });
  }
  return result;
}
