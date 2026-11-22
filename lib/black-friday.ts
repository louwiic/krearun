export const BLACK_FRIDAY_CODE = "BLACK20";
export const BLACK_FRIDAY_EXPIRES_AT = Date.parse("2026-11-29T23:59:59+04:00");

export function isBlackFridayCode(code: string, now = Date.now()) {
  return code.trim().toUpperCase() === BLACK_FRIDAY_CODE && now < BLACK_FRIDAY_EXPIRES_AT;
}
