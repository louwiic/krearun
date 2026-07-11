// E-mails transactionnels via le serveur SMTP de la messagerie Krearun.
// Tous les envois sont non-bloquants côté appelant : une erreur d'e-mail
// ne doit jamais faire échouer un paiement ou une mise à jour de commande.
import nodemailer from "nodemailer";
import type { Order } from "./types";
import { publicColorName } from "./colors";
import { formatPrice } from "./format";

const SMTP_HOST = process.env.SMTP_HOST || "mail95.lwspanel.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || "465");
const SMTP_USER = process.env.SMTP_USER || "contact@krearun.re";
const FROM = process.env.EMAIL_FROM || `Krearun Studio <${SMTP_USER}>`;
const ADMIN_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL || "loicbatonnet.dev@gmail.com";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  const password = process.env.SMTP_PASSWORD;
  if (!password) return null;

  transporter ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
    auth: {
      user: SMTP_USER,
      pass: password,
    },
  });
  return transporter;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!to) return;
  const smtp = getTransporter();
  if (!smtp) {
    console.error("SMTP : variable SMTP_PASSWORD manquante, e-mail non envoyé.");
    return;
  }
  try {
    await smtp.sendMail({
      from: FROM,
      to,
      replyTo: SMTP_USER,
      subject,
      html,
    });
  } catch (e) {
    console.error("SMTP : échec de l'envoi :", e);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Gabarit commun, aux couleurs du site ───────────────────

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:0;background:#faf6ef;font-family:Georgia,'Times New Roman',serif;color:#453a2f;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf6ef;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fdfaf4;border-radius:24px;overflow:hidden;">
<tr><td style="padding:28px 40px;border-bottom:1px solid #e8dcc9;">
  <span style="font-size:22px;font-weight:bold;">Krearun<span style="color:#c07a50;">·</span>Studio</span>
</td></tr>
<tr><td style="padding:36px 40px;font-size:15px;line-height:1.7;">
${content}
</td></tr>
<tr><td style="padding:24px 40px;border-top:1px solid #e8dcc9;font-size:12px;color:#b3a695;">
  Krearun Studio — objets fabriqués avec amour, lentement. ✿<br/>
  Une question ? Répondez simplement à cet e-mail.
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function itemsTable(order: Order): string {
  const rows = order.items
    .map((i) => {
      const customName = i.customName ? escapeHtml(i.customName) : "";
      return `<tr>
<td style="padding:10px 0;border-bottom:1px solid #f2ebde;">${i.name}${i.color ? ` <span style="color:#b3a695;">— ${publicColorName(i.color)}</span>` : ""}${customName ? `<br/><span style="color:#a4623c;font-size:12px;">Prénom : ${customName}</span>` : ""}</td>
<td style="padding:10px 0;border-bottom:1px solid #f2ebde;text-align:center;color:#877867;">× ${i.quantity}</td>
<td style="padding:10px 0;border-bottom:1px solid #f2ebde;text-align:right;">${formatPrice(i.priceCents * i.quantity)}</td>
</tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:20px 0;">
${rows}
<tr><td colspan="2" style="padding:10px 0;color:#877867;">Récupération</td>
<td style="text-align:right;padding:10px 0;">${order.shippingCents === 0 ? "Offerte ✿" : formatPrice(order.shippingCents)}</td></tr>
<tr><td colspan="2" style="padding:10px 0;font-weight:bold;font-size:16px;">Total</td>
<td style="text-align:right;padding:10px 0;font-weight:bold;font-size:16px;">${formatPrice(order.totalCents)}</td></tr>
</table>`;
}

function suiviButton(order: Order): string {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/suivi?commande=${order.number}&email=${encodeURIComponent(order.email)}`;
  return `<p style="text-align:center;margin:28px 0;">
<a href="${url}" style="background:#c07a50;color:#fdfaf4;text-decoration:none;padding:14px 32px;border-radius:999px;font-size:14px;font-weight:bold;">Suivre ma commande</a>
</p>`;
}

// ─── E-mails clients ────────────────────────────────────────

export async function sendOrderConfirmation(order: Order) {
  const prenom = order.name.split(" ")[0] || "vous";
  await sendEmail(
    order.email,
    `✿ Commande #${order.number} bien reçue — merci !`,
    layout(`
<h1 style="font-size:24px;margin:0 0 16px;">Merci ${prenom}, du fond du cœur.</h1>
<p>Votre commande <strong>#${order.number}</strong> est arrivée dans notre atelier.
Chaque pièce est préparée rien que pour vous avec soin (comptez 2 à 4 jours),
puis envoyée ou mise à disposition selon votre choix.</p>
${itemsTable(order)}
<p style="color:#877867;font-size:13px;">Récupération : ${order.addressLine1}${order.addressLine2 ? ", " + order.addressLine2 : ""}, ${order.postalCode} ${order.city}</p>
${suiviButton(order)}
<p>On vous écrit dès que votre colis prend la route. D'ici là, prenez soin de vous ✿</p>`)
  );
}

export async function sendCustomerActivation(email: string, name: string, token: string) {
  const prenom = name.split(" ")[0] || "vous";
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/compte/activer?token=${encodeURIComponent(token)}`;
  await sendEmail(
    email,
    "Activez votre espace client Krearun Studio",
    layout(`
<h1 style="font-size:24px;margin:0 0 16px;">Votre espace client est prêt, ${prenom}.</h1>
<p>Nous avons créé votre compte client pour retrouver vos commandes et suivre leur préparation.</p>
<p>Il ne reste qu'à définir votre mot de passe. Ce lien est valable 7 jours.</p>
<p style="text-align:center;margin:28px 0;">
<a href="${url}" style="background:#c07a50;color:#fdfaf4;text-decoration:none;padding:14px 32px;border-radius:999px;font-size:14px;font-weight:bold;">Définir mon mot de passe</a>
</p>
<p style="color:#877867;font-size:13px;">Si vous n'êtes pas à l'origine de cette commande, ignorez simplement ce message.</p>`)
  );
}

export async function sendOrderShipped(order: Order) {
  const prenom = order.name.split(" ")[0] || "vous";
  const tracking = order.trackingNumber
    ? `<p style="background:#f2ebde;border-radius:16px;padding:16px 20px;text-align:center;">
Numéro de suivi : <strong style="font-size:16px;">${order.trackingNumber}</strong><br/>
<a href="https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(order.trackingNumber)}" style="color:#c07a50;font-size:13px;">Suivre le colis sur laposte.fr →</a>
</p>`
    : "";
  await sendEmail(
    order.email,
    `📦 Votre commande #${order.number} est en route !`,
    layout(`
<h1 style="font-size:24px;margin:0 0 16px;">Ça y est ${prenom}, votre colis voyage vers vous.</h1>
<p>Votre commande <strong>#${order.number}</strong> a été emballée avec soin
(papier de soie et petit mot doux inclus) et vient d'être confiée au transporteur.</p>
${tracking}
${suiviButton(order)}
<p>Merci encore de soutenir notre petit atelier ✿</p>`)
  );
}

export async function sendOrderDelivered(order: Order) {
  const prenom = order.name.split(" ")[0] || "vous";
  await sendEmail(
    order.email,
    `✿ Votre commande #${order.number} est arrivée — on espère qu'elle vous plaît`,
    layout(`
<h1 style="font-size:24px;margin:0 0 16px;">Bienvenue à la maison !</h1>
<p>Votre commande <strong>#${order.number}</strong> est arrivée à bon port.
On espère que vos nouveaux compagnons trouvent déjà leur place.</p>
<p>Un petit mot, une photo de l'objet installé chez ${prenom === "vous" ? "vous" : prenom},
ou quelque chose qui n'allait pas ? Répondez à cet e-mail, on lit tout,
et on répond toujours.</p>
<p>À bientôt au studio ✿</p>`)
  );
}

// ─── Notification admin ─────────────────────────────────────

export async function sendAdminNewOrder(order: Order) {
  await sendEmail(
    ADMIN_EMAIL,
    `🛎 Nouvelle commande #${order.number} — ${formatPrice(order.totalCents)}`,
    layout(`
<h1 style="font-size:22px;margin:0 0 16px;">Nouvelle commande !</h1>
<p><strong>${order.name}</strong> (${order.email}${order.phone ? ", " + order.phone : ""})<br/>
${order.addressLine1}${order.addressLine2 ? ", " + order.addressLine2 : ""}, ${order.postalCode} ${order.city}, ${order.country}</p>
${itemsTable(order)}
<p style="text-align:center;margin:28px 0;">
<a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/admin/commandes" style="background:#453a2f;color:#fdfaf4;text-decoration:none;padding:14px 32px;border-radius:999px;font-size:14px;font-weight:bold;">Ouvrir dans l'admin</a>
</p>`)
  );
}

export async function sendAdminOrderStatus(
  order: Order,
  previousStatus: Order["status"]
) {
  const labels: Record<Order["status"], string> = {
    pending: "En attente",
    paid: "Payée",
    preparing: "En préparation",
    shipped: "Expédiée",
    delivered: "Livrée",
    cancelled: "Annulée",
  };
  await sendEmail(
    ADMIN_EMAIL,
    `Commande #${order.number} — ${labels[order.status]}`,
    layout(`
<h1 style="font-size:22px;margin:0 0 16px;">Statut de commande modifié</h1>
<p>La commande <strong>#${order.number}</strong> de <strong>${order.name}</strong>
est passée de « ${labels[previousStatus]} » à <strong>« ${labels[order.status]} »</strong>.</p>
<p>Client : ${order.email}${order.phone ? ` — ${order.phone}` : ""}</p>
${order.trackingNumber ? `<p>Numéro de suivi : <strong>${order.trackingNumber}</strong></p>` : ""}
<p style="text-align:center;margin:28px 0;">
<a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/admin/commandes/${order.id}" style="background:#453a2f;color:#fdfaf4;text-decoration:none;padding:14px 32px;border-radius:999px;font-size:14px;font-weight:bold;">Voir la commande</a>
</p>`)
  );
}
