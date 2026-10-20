export const AUDIENCE_CONSENT_KEY = "krearun:audience-consent:v1";
export function hasAudienceConsent() {
  if (typeof window === "undefined") return false;
  try {
    const acceptedAt = Number(localStorage.getItem(`${AUDIENCE_CONSENT_KEY}:date-ms`));
    return localStorage.getItem(AUDIENCE_CONSENT_KEY) === "accepted" && acceptedAt > 0 && Date.now() - acceptedAt < 183 * 24 * 60 * 60_000;
  } catch { return false; }
}
