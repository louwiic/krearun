import test from "node:test";
import assert from "node:assert/strict";
import { createResendSender } from "../lib/resend-delivery.ts";

const email = { from: "Krearun <test@example.invalid>", to: ["recipient@example.invalid"], reply_to: "test@example.invalid", subject: "Test", html: "<p>Test</p>" };
function fixture(responses) {
  let time = 0;
  const calls = [];
  const sender = createResendSender({ now: () => time, pause: async ms => { time += ms; }, fetchImpl: async (_url, options) => {
    calls.push({ time, key: options.headers["Idempotency-Key"], recipient: JSON.parse(options.body).to });
    const response = responses.shift();
    if (response instanceof Error) throw response;
    return response || new Response('{"id":"test"}', { status: 200 });
  } });
  return { sender, calls };
}

test("concurrent messages are queued and spaced, with separate logical-message keys", async () => {
  const { sender, calls } = fixture([]);
  const results = await Promise.all(Array.from({ length: 79 }, () => sender("fake-key", email)));
  assert.equal(results.filter(result => result.accepted).length, 79);
  assert.equal(new Set(calls.map(call => call.key)).size, 79);
  for (let index = 1; index < calls.length; index++) assert.ok(calls[index].time - calls[index - 1].time >= 250);
});

test("429 rate limits respect Retry-After and retry the identical idempotency key", async () => {
  const { sender, calls } = fixture([new Response('{"name":"rate_limit_exceeded"}', { status: 429, headers: { "retry-after": "2" } })]);
  assert.deepEqual(await sender("fake-key", email), { accepted: true });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].key, calls[1].key);
  assert.ok(calls[1].time - calls[0].time >= 2000);
});

test("daily/monthly quotas and invalid recipients are not blindly retried", async () => {
  for (const [status, name] of [[429, "daily_quota_exceeded"], [429, "monthly_quota_exceeded"], [422, "validation_error"]]) {
    const { sender, calls } = fixture([new Response(JSON.stringify({ name }), { status })]);
    assert.deepEqual(await sender("fake-key", email), { accepted: false, reason: name });
    assert.equal(calls.length, 1);
  }
});

test("a lost network response is retried with the same key; retries are bounded", async () => {
  const recovered = fixture([new Error("network")]);
  assert.equal((await recovered.sender("fake-key", email)).accepted, true);
  assert.equal(recovered.calls[0].key, recovered.calls[1].key);
  const exhausted = fixture(Array.from({ length: 4 }, () => new Response('{"name":"rate_limit_exceeded"}', { status: 429 })));
  assert.equal((await exhausted.sender("fake-key", email)).accepted, false);
  assert.equal(exhausted.calls.length, 4);
});
