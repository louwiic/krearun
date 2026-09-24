import test from "node:test";
import assert from "node:assert/strict";
import { mailingContacts, newsletterRecipients } from "../lib/newsletter-targeting.ts";

const records = [
  { id: "1", email: "Recent@Example.com", ignored: false, createdAt: "", source: "newsletter" },
  { id: "2", email: "ignored@example.com", ignored: true, createdAt: "", source: "customer" },
  { id: "3", email: "subscriber@example.com", ignored: false, createdAt: "", source: "" },
];
const orders = [
  { email: "recent@example.com", orderedAt: "2026-09-12T00:00:00Z", status: "paid" },
  { email: "buyer@example.com", orderedAt: "2026-07-01T00:00:00Z", status: "delivered" },
  { email: "buyer@example.com", orderedAt: "2026-06-01T00:00:00Z", status: "paid" },
  { email: "ignored@example.com", orderedAt: "2026-09-10T00:00:00Z", status: "paid" },
  { email: "cancelled@example.com", orderedAt: "2026-09-09T00:00:00Z", status: "cancelled" },
];
const now = new Date("2026-09-24T00:00:00Z");

test("buyers without newsletter registration are available in every relevant segment", () => {
  const contacts = mailingContacts(records, orders);
  assert.equal(contacts.find((contact) => contact.email === "buyer@example.com")?.subscribed, false);
  assert.equal(contacts.find((contact) => contact.email === "recent@example.com")?.subscribed, true);
  assert.deepEqual(newsletterRecipients(contacts, "all", [], now), ["recent@example.com", "subscriber@example.com", "buyer@example.com"]);
  assert.deepEqual(newsletterRecipients(contacts, "recent", [], now), ["recent@example.com"]);
  assert.deepEqual(newsletterRecipients(contacts, "older", [], now), ["buyer@example.com"]);
  assert.deepEqual(newsletterRecipients(contacts, "custom", ["BUYER@example.com", "ignored@example.com"], now), ["buyer@example.com"]);
});

test("an ignored buyer is excluded and cancelled orders do not create contacts", () => {
  const contacts = mailingContacts(records, orders);
  assert.equal(contacts.some((contact) => contact.email === "cancelled@example.com"), false);
  assert.equal(contacts.find((contact) => contact.email === "ignored@example.com")?.ignored, true);
  assert.equal(newsletterRecipients(contacts, "all", [], now).includes("ignored@example.com"), false);
});
