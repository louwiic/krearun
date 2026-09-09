export type OrderDateFilter = {
  mode: "all" | "month" | "range";
  month: string;
  from: string;
  to: string;
};

// OR within one group of statuses; an empty selection means all statuses.
export function matchesSelectedStatus(
  value: string,
  selected: readonly string[],
): boolean {
  return selected.length === 0 || selected.includes(value);
}

export function toggleStatusFilter(
  selected: readonly string[],
  value: string,
  checked: boolean,
): string[] {
  return checked
    ? [...new Set([...selected, value])]
    : selected.filter((status) => status !== value);
}

const reunionDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Indian/Reunion",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// The same calendar day on the server and in the browser, including month boundaries.
export function orderDateKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = reunionDate.formatToParts(date);
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join("-");
}

export function matchesOrderDate(
  value: string,
  filter: OrderDateFilter,
): boolean {
  if (filter.mode === "all") return true;
  const day = orderDateKey(value);
  if (!day) return false;
  if (filter.mode === "month")
    return !filter.month || day.startsWith(`${filter.month}-`);
  if (filter.from && filter.to && filter.from > filter.to) return false;
  return (
    (!filter.from || day >= filter.from) && (!filter.to || day <= filter.to)
  );
}

export function paginateRows<T>(
  rows: readonly T[],
  requestedPage: number,
  requestedSize: number,
) {
  const pageSize = [10, 25, 50, 100].includes(requestedSize)
    ? requestedSize
    : 25;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.max(
    1,
    Math.min(
      totalPages,
      Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1,
    ),
  );
  const offset = (page - 1) * pageSize;
  const items = rows.slice(offset, offset + pageSize);
  return {
    items,
    page,
    pageSize,
    totalPages,
    total: rows.length,
    start: rows.length ? offset + 1 : 0,
    end: offset + items.length,
  };
}

export function togglePageSelection(
  selected: readonly string[],
  pageIds: readonly string[],
  checked: boolean,
): string[] {
  const next = new Set(selected);
  for (const id of pageIds) {
    if (checked) next.add(id);
    else next.delete(id);
  }
  return [...next];
}
