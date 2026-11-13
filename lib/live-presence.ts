"use client";
import { journeySessionId } from "./journey-tracking";
import { LIVE_AVATARS, type LiveAction } from "./live-avatars";

// État client du parcours guidé de /boutique-live, partagé entre le tracker
// global (ping périodique) et la page live (actions immédiates). La zone et
// l'action ne sont envoyées que depuis la page live ; l'avatar partout.
const AVATAR_KEY = "krearun:live-avatar";
const state: { zone: string | null; action: LiveAction | null } = { zone: null, action: null };

export function liveGuidedState() {
  return { ...state };
}

export function setLiveGuidedState(partial: { zone?: string | null; action?: LiveAction | null }) {
  if (partial.zone !== undefined) state.zone = partial.zone;
  if (partial.action !== undefined) state.action = partial.action;
  sendPresencePing();
}

export function clearLiveGuidedState() {
  state.zone = null;
  state.action = null;
}

export function liveAvatarChoice(): number | null {
  try {
    const raw = window.localStorage.getItem(AVATAR_KEY);
    if (raw === null) return null;
    const saved = Number(raw);
    if (Number.isInteger(saved) && saved >= 0 && saved < LIVE_AVATARS.length) return saved;
  } catch {}
  return null;
}

export function setLiveAvatarChoice(index: number) {
  try { window.localStorage.setItem(AVATAR_KEY, String(index)); } catch {}
  sendPresencePing();
}

export function sendPresencePing() {
  if (typeof document === "undefined" || document.visibilityState !== "visible") return;
  const sessionId = journeySessionId();
  if (!sessionId) return;
  const path = `${window.location.pathname}${window.location.search}`.slice(0, 160);
  const body: Record<string, unknown> = { sessionId, path };
  const avatar = liveAvatarChoice();
  if (avatar !== null) body.avatar = avatar;
  if (window.location.pathname === "/boutique-live") {
    if (state.zone) body.zone = state.zone;
    if (state.action) body.action = state.action;
  }
  fetch("/api/presence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
    signal: AbortSignal.timeout(5000),
  }).catch(() => {});
}

// Identifiant public de sa propre session : même dérivation que le serveur
// (sha256 de "live:<sessionId>"), pour se reconnaître dans la liste.
export async function liveSelfId(): Promise<string | null> {
  const sessionId = journeySessionId();
  if (!sessionId || !crypto.subtle) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`live:${sessionId}`));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("").slice(0, 10);
}
