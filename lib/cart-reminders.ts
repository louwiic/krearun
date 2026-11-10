import { parseKeychainConfiguration } from "./name-keychain";
import type { CartItem } from "./types";

export const CART_REMINDER_CONSENT_VERSION = "2026-11-09-v1";
export const CART_REMINDER_CONSENT = "J’accepte de recevoir un seul rappel par email pour ce panier. Je peux annuler cette demande à tout moment.";
export const REMINDER_DELAY_MS = 60 * 60_000;
export const REMINDER_RETENTION_MS = 30 * 86400_000;
export type ReminderCartItem = Pick<CartItem, "productId" | "quantity" | "color" | "variantId" | "customName" | "clickerConfiguration" | "keychainConfiguration">;
export type CartReminder = {
  id: string; email: string; emailHash: string; tokenHash: string; deliveryToken: string; cart: ReminderCartItem[];
  status: "unconfirmed" | "pending" | "sent" | "cancelled" | "purchased" | "failed";
  consentVersion: string; consentAt: string; confirmedAt: string; dueAt: string; expiresAt: string; checkoutIds: string[];
};
export const REMINDER_TOKEN = /^[a-f0-9]{64}$/;
export function reminderEmail(value: unknown): string {
  if (typeof value !== "string") throw new Error("Indiquez une adresse email valide.");
  const email = value.trim().toLowerCase();
  if (email.length > 160 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Indiquez une adresse email valide.");
  return email;
}
export function reminderCart(value: unknown): ReminderCartItem[] {
  if (!Array.isArray(value) || !value.length || value.length > 30) throw new Error("Votre panier doit contenir au moins un article.");
  return value.map(item => {
    if (!item || typeof item !== "object" || !/^(?:[a-z0-9]{15}|clicker-studio|name-keychain)$/.test(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) throw new Error("Panier invalide.");
    const clean: ReminderCartItem = { productId: item.productId, quantity: item.quantity, color: typeof item.color === "string" ? item.color.slice(0, 100) : "" };
    if (typeof item.variantId === "string") clean.variantId = item.variantId.slice(0, 80);
    if (typeof item.customName === "string") clean.customName = item.customName.slice(0, 1000);
    if (item.clickerConfiguration && typeof item.clickerConfiguration === "object") {
      const config = item.clickerConfiguration;
      const text = typeof config.text === "string" ? config.text.slice(0, 100) : "";
      const string = (key: string) => typeof config[key] === "string" ? config[key].slice(0, 100) : "";
      clean.clickerConfiguration = { text, characterCount: Array.from(text).length, baseColor: string("baseColor"), capColor: string("capColor"), letterColor: string("letterColor"), symbol: string("symbol"), symbolNote: string("symbolNote") };
    }
    if (item.productId === "name-keychain") clean.keychainConfiguration = parseKeychainConfiguration(item.keychainConfiguration);
    return clean;
  });
}
export function canConfirmReminder(reminder: CartReminder, now = Date.now()) {
  return reminder.status === "unconfirmed" && now - Date.parse(reminder.consentAt) <= 86400_000 && Date.parse(reminder.expiresAt) > now;
}
export function canSendReminder(reminder: CartReminder, now = Date.now()) {
  return reminder.status === "pending" && reminder.consentVersion === CART_REMINDER_CONSENT_VERSION && Boolean(reminder.confirmedAt) && Date.parse(reminder.dueAt) <= now && Date.parse(reminder.expiresAt) > now;
}
export function shouldShowCartReturn(lastSeen: number, itemCount: number, now = Date.now()) {
  return itemCount > 0 && Number.isFinite(lastSeen) && lastSeen > 0 && now - lastSeen >= 30 * 60_000;
}
