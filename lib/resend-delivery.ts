import { randomUUID } from "node:crypto";

type Email = { from: string; to: string[]; reply_to: string; subject: string; html: string };
type Delivery = { accepted: true } | { accepted: false; reason: string };

// One queue per server process also paces transactional messages sharing the API key.
// Provider-side throttling is retried with the same idempotency key across attempts.
export function createResendSender({
  fetchImpl = fetch,
  pause = (milliseconds: number) => new Promise<void>(resolve => setTimeout(resolve, milliseconds)),
  now = Date.now,
  intervalMs = 250,
}: { fetchImpl?: typeof fetch; pause?: (milliseconds: number) => Promise<void>; now?: () => number; intervalMs?: number } = {}) {
  let queue: Promise<unknown> = Promise.resolve();
  let lastStarted = -Infinity;

  return (apiKey: string, email: Email): Promise<Delivery> => {
    const idempotencyKey = `email-${randomUUID()}`;
    const task = queue.then(async (): Promise<Delivery> => {
      for (let attempt = 0; attempt < 4; attempt++) {
        const delay = intervalMs - (now() - lastStarted);
        if (delay > 0) await pause(delay);
        lastStarted = now();
        let response: Response;
        try {
          response = await fetchImpl("https://api.resend.com/emails", {
            method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
            body: JSON.stringify(email), signal: AbortSignal.timeout(20_000),
          });
        } catch {
          if (attempt === 3) return { accepted: false, reason: "network_error" };
          await pause(1000 * 2 ** attempt);
          continue;
        }
        if (response.ok) return { accepted: true };
        const problem = await response.json().catch(() => ({})) as { name?: string };
        const reason = problem.name || `http_${response.status}`;
        const quotaExceeded = /quota_exceeded/.test(reason);
        const retryable = (response.status === 429 && !quotaExceeded) || response.status >= 500;
        if (!retryable || attempt === 3) return { accepted: false, reason };
        const retryAfter = Number(response.headers.get("retry-after"));
        await pause(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 30_000) : 1000 * 2 ** attempt);
      }
      return { accepted: false, reason: "retry_exhausted" };
    });
    queue = task.catch(() => undefined);
    return task;
  };
}
