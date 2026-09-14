"use client";

import type { LetterEvent } from "./letter-events";

let fallbackVisitor = "";
const completed = new Set<string>();
const pending = new Set<string>();
const sessionEvents = new Map<string, string>();

function storedId(storage: Storage, key: string) {
  const previous = storage.getItem(key);
  if (previous) return previous;
  const value = crypto.randomUUID(); storage.setItem(key, value); return value;
}

export function trackLetterEvent(kind: LetterEvent["kind"], format: LetterEvent["format"] = "") {
  if (typeof window === "undefined") return;
  let visitorId: string;
  let eventId: string;
  try {
    fallbackVisitor ||= crypto.randomUUID();
    visitorId = fallbackVisitor;
    try { visitorId = storedId(localStorage, "krearun-letter-visitor"); } catch { /* Storage may be disabled. */ }
    if (kind === "view" || kind === "interact") {
      eventId = sessionEvents.get(kind) || crypto.randomUUID();
      try { eventId = storedId(sessionStorage, `krearun-letter-${kind}`); } catch { /* Keep the in-memory ID. */ }
      sessionEvents.set(kind, eventId);
    } else eventId = crypto.randomUUID();
  } catch { return; }
  if (completed.has(eventId) || pending.has(eventId)) return;
  pending.add(eventId);
  const payload: LetterEvent = { eventId, visitorId, kind, format };
  void (async () => {
    try {
      // Reuse the same event ID on retry so an acknowledged hit cannot be counted twice.
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await fetch("/api/letter-events", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload), keepalive: true,
          });
          if (response.ok) { completed.add(eventId); return; }
          if (response.status < 500) return;
        } catch { /* Analytics must not interrupt the configurator. */ }
      }
    } finally { pending.delete(eventId); }
  })();
}
