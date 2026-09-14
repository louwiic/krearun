export const LETTER_EVENT_KINDS = ["click", "view", "interact", "download"] as const;
export type LetterEvent = {
  eventId: string;
  visitorId: string;
  kind: typeof LETTER_EVENT_KINDS[number];
  format: "" | "stl" | "3mf";
};

export function parseLetterEvent(value: unknown): LetterEvent | null {
  if (!value || typeof value !== "object") return null;
  const { eventId, visitorId, kind, format = "" } = value as Record<string, unknown>;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (typeof eventId !== "string" || !uuid.test(eventId) || typeof visitorId !== "string" || !uuid.test(visitorId)) return null;
  if (!LETTER_EVENT_KINDS.includes(kind as LetterEvent["kind"])) return null;
  if (kind === "download" ? format !== "stl" && format !== "3mf" : format !== "") return null;
  return { eventId, visitorId, kind: kind as LetterEvent["kind"], format: format as LetterEvent["format"] };
}
