import test from "node:test";
import assert from "node:assert/strict";
import { newsletterRecipients } from "../lib/newsletter-targeting.ts";

const contacts = [
  { id: "1", email: "Recent@Example.com", ignored: false, createdAt: "" },
  { id: "2", email: "older@example.com", ignored: false, createdAt: "" },
  { id: "3", email: "ignored@example.com", ignored: true, createdAt: "" },
  { id: "4", email: "never@example.com", ignored: false, createdAt: "" },
];
const orders = [
  { email: "recent@example.com", orderedAt: "2026-09-12T00:00:00Z", status: "paid" },
  { email: "older@example.com", orderedAt: "2026-07-01T00:00:00Z", status: "delivered" },
  { email: "ignored@example.com", orderedAt: "2026-09-10T00:00:00Z", status: "paid" },
  { email: "never@example.com", orderedAt: "2026-09-09T00:00:00Z", status: "cancelled" },
];
const now = new Date("2026-09-24T00:00:00Z");

test("segments use the latest valid order and exclude ignored contacts", () => {
  assert.deepEqual(newsletterRecipients(contacts, orders, "all", [], now), ["recent@example.com", "older@example.com", "never@example.com"]);
  assert.deepEqual(newsletterRecipients(contacts, orders, "recent", [], now), ["recent@example.com"]);
  assert.deepEqual(newsletterRecipients(contacts, orders, "older", [], now), ["older@example.com"]);
  assert.deepEqual(newsletterRecipients(contacts, orders, "custom", ["OLDER@example.com", "ignored@example.com"], now), ["older@example.com"]);
});
