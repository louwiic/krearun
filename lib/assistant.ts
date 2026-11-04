import { createHmac, timingSafeEqual } from "node:crypto";

export const ASSISTANT_MODEL = "gpt-5.4-mini";
export const ASSISTANT_MAX_CALLS = 4;
export const ASSISTANT_MAX_OUTPUT = 1200;
export type AssistantProposal = { id: string; summary: string; status: string; expiresAt: string };
export type AssistantReply = { message: string; proposals: AssistantProposal[] };
export type AssistantRun = {
  id: string; requestKey: string; actor: string; channel: "admin" | "whatsapp";
  message: string; state: string; result: AssistantReply | null;
  inputTokens: number; outputTokens: number; estimatedUsd: number; created: string;
};
export function assistantConfig() {
  const requested = Number(process.env.ASSISTANT_MONTHLY_REQUEST_LIMIT || 300);
  return {
    enabled: process.env.ASSISTANT_ENABLED === "true",
    openaiReady: Boolean(process.env.OPENAI_API_KEY?.trim()),
    model: ASSISTANT_MODEL,
    monthlyLimit: Number.isSafeInteger(requested) && requested >= 1 && requested <= 10000 ? requested : 300,
    whatsappReady: ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_APP_SECRET", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_VERIFY_TOKEN", "WHATSAPP_ADMIN_NUMBERS", "WHATSAPP_GRAPH_VERSION", "ASSISTANT_WORKER_SECRET"].every(k => Boolean(process.env[k]?.trim())),
  };
}
export function estimateAssistantUsd(inputTokens: number, outputTokens: number) {
  // Conservative: cached input is counted at the full input price.
  return (inputTokens * 0.75 + outputTokens * 4.5) / 1_000_000;
}
export function assistantMonth(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Indian/Reunion", year: "numeric", month: "2-digit" }).format(now);
}
export function validAssistantId(value: unknown): value is string { return typeof value === "string" && /^[a-z0-9]{15}$/.test(value); }
export function assistantText(value: unknown, max = 3000): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error("Texte manquant ou trop long.");
  return value.trim();
}
export function assistantInteger(value: unknown, max: number): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > max) throw new Error("Nombre invalide.");
  return value;
}
export function verifyWhatsAppSignature(raw: string, signature: string | null, secret: string): boolean {
  if (!secret || !signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  return timingSafeEqual(Buffer.from(signature.slice(7), "hex"), createHmac("sha256", secret).update(raw).digest());
}
export function whatsappAdmins(): string[] {
  return (process.env.WHATSAPP_ADMIN_NUMBERS || "").split(",").map(v => v.trim().replace(/^\+/, "")).filter(v => /^[1-9]\d{7,14}$/.test(v));
}
export function extractWhatsAppMessages(payload: unknown, phoneId: string, admins: string[], now = Date.now()) {
  const result: { key: string; from: string; message: string }[] = [];
  if (!payload || typeof payload !== "object" || !("entry" in payload) || !Array.isArray(payload.entry)) return result;
  for (const entry of payload.entry) for (const change of entry?.changes || []) {
    const value = change?.value;
    if (value?.metadata?.phone_number_id !== phoneId) continue;
    for (const m of value.messages || []) {
      if (!admins.includes(m.from) || typeof m.id !== "string" || m.id.length > 250 || m.type !== "text" || typeof m.text?.body !== "string" || m.text.body.length > 3000) continue;
      const time = Number(m.timestamp) * 1000;
      if (!Number.isFinite(time) || Math.abs(now - time) > 23 * 3600000) continue;
      result.push({ key: m.id, from: m.from, message: m.text.body.trim() });
    }
  }
  return result.filter(m => m.message);
}
export async function boundedBody(request: Request, limit: number): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Requête vide.");
  const chunks: Uint8Array[] = []; let size = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length;
    if (size > limit) { await reader.cancel(); throw new Error("Requête trop volumineuse."); }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
