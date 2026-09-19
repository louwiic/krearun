import "server-only";
import type { ColissimoAddress } from "./colissimo";

export function colissimoConfig() {
  const sender: ColissimoAddress = {
    companyName: process.env.COLISSIMO_SENDER_NAME || "Krearun Studio",
    line2: process.env.COLISSIMO_SENDER_ADDRESS || "",
    ...(process.env.COLISSIMO_SENDER_ADDRESS_EXTRA ? { line3: process.env.COLISSIMO_SENDER_ADDRESS_EXTRA } : {}),
    city: process.env.COLISSIMO_SENDER_CITY || "",
    zipCode: process.env.COLISSIMO_SENDER_POSTAL_CODE || "",
    countryCode: process.env.COLISSIMO_SENDER_COUNTRY || "RE",
    ...(process.env.COLISSIMO_SENDER_EMAIL ? { email: process.env.COLISSIMO_SENDER_EMAIL } : {}),
    ...(process.env.COLISSIMO_SENDER_PHONE ? { phoneNumber: process.env.COLISSIMO_SENDER_PHONE } : {}),
  };
  const missing = [
    ["Clé API Colissimo", process.env.COLISSIMO_API_KEY], ["Rue de l’expéditeur", sender.line2],
    ["Ville de l’expéditeur", sender.city], ["Code postal de l’expéditeur", sender.zipCode],
  ].filter(([, value]) => !value).map(([name]) => name!);
  return { sender, missing, live: process.env.COLISSIMO_MODE === "production" };
}

export async function callColissimo(payload: unknown, validation: boolean) {
  const apiKey = process.env.COLISSIMO_API_KEY;
  if (!apiKey) throw new Error("Clé Colissimo manquante.");
  const response = await fetch(`https://ws.colissimo.fr/sls-ws/SlsServiceWSRest/3.1/${validation ? "checkGenerateLabel" : "generateLabel"}`, {
    method: "POST", headers: { apiKey, "Content-Type": "application/json", Accept: validation ? "application/json" : "multipart/mixed" },
    body: JSON.stringify(payload), cache: "no-store", signal: AbortSignal.timeout(45000),
  });
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (!response.body) throw new Error("Réponse Colissimo vide.");
  const reader = response.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 12 * 1024 * 1024) throw new Error("Réponse Colissimo trop volumineuse.");
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  return { body: Buffer.concat(chunks), contentType: response.headers.get("content-type") || "", ok: response.ok };
}
