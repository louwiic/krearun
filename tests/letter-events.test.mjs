import test from "node:test";
import assert from "node:assert/strict";
import { createJiti } from "jiti";
const jiti = createJiti(import.meta.url, { fsCache: false });
const { parseLetterEvent } = await jiti.import("../lib/letter-events.ts");
const event = { eventId: crypto.randomUUID(), visitorId: crypto.randomUUID(), kind: "view", format: "" };

test("only supported analytics events and download formats are accepted", () => {
  assert.deepEqual(parseLetterEvent(event), event);
  assert.ok(parseLetterEvent({ ...event, kind: "download", format: "3mf" }));
  for (const change of [{ kind: "other" }, { kind: "download" }, { format: "stl" }, { visitorId: "bad' filter" }, { eventId: "" }]) {
    assert.equal(parseLetterEvent({ ...event, ...change }), null);
  }
  assert.equal(parseLetterEvent(null), null);
});

test("personalization data is never forwarded to storage", () => {
  assert.deepEqual(parseLetterEvent({ ...event, name: "Louise", email: "test@example.com", price: 1 }), event);
});
