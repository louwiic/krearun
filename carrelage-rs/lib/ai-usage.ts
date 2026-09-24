export type TokenUsage = {
  input: number;
  cached: number;
  output: number;
  reasoning: number;
};
export type UsageEvent = {
  id: string;
  date: string;
  model: string;
  status: "pending" | "success" | "rejected" | "error";
  usage: TokenUsage | null;
  costNanoUsd: number | null;
  pricing: string;
};
export const PRICING_VERSION = "gpt-5-mini-standard-2026-09-15";
export function tokensFromResponse(value: unknown): TokenUsage | null {
  if (!value || typeof value !== "object") return null;
  const v = value as {
    prompt_tokens?: number;
    completion_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number };
    completion_tokens_details?: { reasoning_tokens?: number };
  };
  const input = v.prompt_tokens,
    output = v.completion_tokens,
    cached = v.prompt_tokens_details?.cached_tokens ?? 0,
    reasoning = v.completion_tokens_details?.reasoning_tokens ?? 0;
  if (
    typeof input !== "number" ||
    typeof output !== "number" ||
    ![input, output, cached, reasoning].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    ) ||
    cached > input ||
    reasoning > output
  )
    return null;
  return { input, output, cached, reasoning };
}
// Integer nanodollars retain sub-cent charges. Reasoning is already included in output.
export function estimateNanoUsd(usage: TokenUsage) {
  return (
    (usage.input - usage.cached) * 250 + usage.cached * 25 + usage.output * 2000
  );
}
export function monthKey(date: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Indian/Reunion",
    year: "numeric",
    month: "2-digit",
  }).format(new Date(date));
}
export function summarizeUsage(events: UsageEvent[], now = new Date()) {
  const month = monthKey(now.toISOString());
  return {
    attempts: events.length,
    successes: events.filter((e) => e.status === "success").length,
    rejected: events.filter((e) => e.status === "rejected").length,
    errors: events.filter((e) => e.status === "error").length,
    unknown: events.filter((e) => e.costNanoUsd === null).length,
    input: events.reduce((n, e) => n + (e.usage?.input ?? 0), 0),
    output: events.reduce((n, e) => n + (e.usage?.output ?? 0), 0),
    totalUsd: events.reduce((n, e) => n + (e.costNanoUsd ?? 0), 0) / 1e9,
    monthUsd:
      events
        .filter((e) => monthKey(e.date) === month)
        .reduce((n, e) => n + (e.costNanoUsd ?? 0), 0) / 1e9,
    since: events.length ? events.map((e) => e.date).sort()[0] : null,
  };
}
export type UsageSummary = ReturnType<typeof summarizeUsage>;
