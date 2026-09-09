import test from "node:test";
import assert from "node:assert/strict";
import {
  matchesOrderDate,
  matchesSelectedStatus,
  orderDateKey,
  paginateRows,
  togglePageSelection,
  toggleStatusFilter,
} from "../lib/order-list.ts";

test("status filters support several choices, reset and independent production/payment groups", () => {
  const statuses = toggleStatusFilter(["pending"], "ready", true);
  assert.deepEqual(statuses, ["pending", "ready"]);
  assert.deepEqual(toggleStatusFilter(statuses, "ready", true), statuses);
  assert.equal(matchesSelectedStatus("pending", statuses), true);
  assert.equal(matchesSelectedStatus("ready", statuses), true);
  assert.equal(matchesSelectedStatus("delivered", statuses), false);
  assert.equal(matchesSelectedStatus("review", []), true);
  assert.deepEqual(toggleStatusFilter(statuses, "pending", false), ["ready"]);
  assert.deepEqual(toggleStatusFilter(["ready"], "ready", false), []);
  const rows = [
    { status: "ready", payment: "paid", date: "2026-09-01T08:00:00Z" },
    { status: "pending", payment: "unpaid", date: "2026-09-02T08:00:00Z" },
    { status: "ready", payment: "deposit", date: "2026-09-03T08:00:00Z" },
    { status: "delivered", payment: "unpaid", date: "2026-09-03T08:00:00Z" },
    { status: "ready", payment: "unpaid", date: "2026-08-01T08:00:00Z" },
  ];
  const result = rows.filter(
    (row) =>
      matchesSelectedStatus(row.status, statuses) &&
      matchesSelectedStatus(row.payment, ["unpaid", "deposit"]) &&
      matchesOrderDate(row.date, {
        mode: "month",
        month: "2026-09",
        from: "",
        to: "",
      }),
  );
  assert.deepEqual(result, [rows[1], rows[2]]);
  assert.equal(paginateRows(result, 1, 10).total, 2);
});

test("month and day filters use Reunion time, including the last evening of a UTC month", () => {
  assert.equal(orderDateKey("2026-08-31T21:30:00Z"), "2026-09-01");
  const filter = {
    mode: "month",
    month: "2026-09",
    from: "2020-01-01",
    to: "2020-01-02",
  };
  assert.equal(matchesOrderDate("2026-08-31T21:30:00Z", filter), true);
  assert.equal(matchesOrderDate("2026-08-31T19:59:59Z", filter), false);
  assert.equal(matchesOrderDate("2026-09-30T20:00:00Z", filter), false);
});
test("date range is inclusive, supports a single day and ignores an inactive month filter", () => {
  const filter = {
    mode: "range",
    month: "2020-01",
    from: "2026-09-09",
    to: "2026-09-09",
  };
  assert.equal(matchesOrderDate("2026-09-08T20:00:00Z", filter), true);
  assert.equal(matchesOrderDate("2026-09-09T19:59:59.999Z", filter), true);
  assert.equal(matchesOrderDate("2026-09-09T20:00:00Z", filter), false);
  assert.equal(
    matchesOrderDate("2026-09-09T12:00:00Z", { ...filter, from: "2026-09-10" }),
    false,
  );
  assert.equal(
    matchesOrderDate("2026-09-09T12:00:00Z", { ...filter, from: "" }),
    true,
  );
  assert.equal(
    matchesOrderDate("2026-09-09T12:00:00Z", { ...filter, mode: "all" }),
    true,
  );
});
test("pagination clamps empty/outdated pages and does not lose or repeat rows", () => {
  const rows = Array.from({ length: 183 }, (_, i) => i + 1);
  assert.equal(paginateRows(rows, 1, 25).totalPages, 8);
  assert.deepEqual(
    paginateRows(rows, 8, 25).items,
    [176, 177, 178, 179, 180, 181, 182, 183],
  );
  assert.equal(paginateRows(rows.slice(0, 3), 8, 25).page, 1);
  assert.equal(paginateRows([], 8, 25).start, 0);
  assert.equal(paginateRows([], 8, 25).end, 0);
  assert.equal(paginateRows(rows, 1, 0).pageSize, 25);
  const combined = Array.from(
    { length: 8 },
    (_, i) => paginateRows(rows, i + 1, 25).items,
  ).flat();
  assert.deepEqual(combined, rows);
});
test("selecting or clearing a page preserves selections on other pages", () => {
  assert.deepEqual(togglePageSelection(["a", "z"], ["a", "b"], true), [
    "a",
    "z",
    "b",
  ]);
  assert.deepEqual(togglePageSelection(["a", "b", "z"], ["a", "b"], false), [
    "z",
  ]);
});
