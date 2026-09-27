import "server-only";

import { ImapFlow } from "imapflow";
import { simpleParser, type ParsedMail } from "mailparser";
import nodemailer from "nodemailer";

export type ContactMessage = {
  uid: number;
  subject: string;
  from: string;
  fromEmail: string;
  to: string;
  date: string;
  text: string;
  unread: boolean;
};

function config() {
  // Réutilise les identifiants SMTP existants si aucun réglage IMAP dédié
  // n'est défini : il s'agit de la même boîte de messagerie.
  const host = (process.env.CONTACT_IMAP_HOST || process.env.SMTP_HOST)?.trim();
  const user = (process.env.CONTACT_IMAP_USER || process.env.SMTP_USER)?.trim();
  const password = process.env.CONTACT_IMAP_PASSWORD || process.env.SMTP_PASSWORD;
  if (!host || !user || !password) return null;
  return {
    host,
    port: Number(process.env.CONTACT_IMAP_PORT || 993),
    secure: process.env.CONTACT_IMAP_SECURE !== "false",
    auth: { user, pass: password },
    mailbox: process.env.CONTACT_IMAP_MAILBOX?.trim() || "INBOX",
  };
}

function addresses(value: ParsedMail["from"] | ParsedMail["to"]): string {
  const entries = (Array.isArray(value) ? value : value?.value ?? []).flatMap((entry) =>
    "value" in entry ? entry.value : [entry],
  );
  return entries.map((entry) => entry.name ? `${entry.name} <${entry.address ?? ""}>` : entry.address ?? "").join(", ") || "—";
}

async function withInbox<T>(callback: (client: ImapFlow) => Promise<T>): Promise<T> {
  const options = config();
  if (!options) throw new Error("Boîte contact non configurée dans Coolify.");
  const client = new ImapFlow(options);
  let phase = "connexion au serveur IMAP";
  try {
    await client.connect();
    phase = `ouverture de ${options.mailbox}`;
    await client.mailboxOpen(options.mailbox, { readOnly: true });
    phase = "lecture des messages";
    return await callback(client);
  } catch (error) {
    const detail = error instanceof Error && error.message
      ? error.message
      : "le serveur a refusé la commande IMAP";
    const code = typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
    const responseStatus = typeof error === "object" && error && "responseStatus" in error
      ? String(error.responseStatus || "")
      : "";
    const responseText = typeof error === "object" && error && "responseText" in error
      ? String(error.responseText || "")
      : "";
    const response = typeof error === "object" && error && "response" in error
      ? String((error.response as { text?: string } | undefined)?.text || "")
      : "";
    const diagnostic = [code, responseStatus, responseText, response].filter(Boolean).join(" · ");
    throw new Error(`IMAP — ${phase} : ${detail}${diagnostic ? ` [${diagnostic}]` : ""}`);
  } finally {
    await client.logout().catch(() => undefined);
  }
}

function toMessage(uid: number, parsed: ParsedMail, flags?: Set<string>): ContactMessage {
  const addressEntries = (Array.isArray(parsed.from) ? parsed.from : parsed.from?.value ?? []).flatMap((entry) =>
    "value" in entry ? entry.value : [entry],
  );
  return {
    uid,
    subject: parsed.subject || "(Sans objet)",
    from: addresses(parsed.from),
    fromEmail: addressEntries.find((entry) => entry.address)?.address || "",
    to: addresses(parsed.to),
    date: (parsed.date || new Date()).toISOString(),
    text: (parsed.text || "").trim(),
    unread: !flags?.has("\\Seen"),
  };
}

export async function getContactMessages(limit = 50): Promise<ContactMessage[]> {
  return withInbox(async (client) => {
    const uids = (await client.search({ all: true }, { uid: true })) || [];
    const recent = uids.slice(-limit).reverse();
    const messages: ContactMessage[] = [];
    for (const uid of recent) {
      const message = await client.fetchOne(uid, { source: true, flags: true }, { uid: true });
      const source = message && message.source;
      if (!source) continue;
      const parsed = await simpleParser(source);
      messages.push(toMessage(uid, parsed, message.flags));
    }
    return messages;
  });
}

export async function getContactMessage(uid: number): Promise<ContactMessage | null> {
  return withInbox(async (client) => {
    const message = await client.fetchOne(uid, { source: true, flags: true }, { uid: true });
    const source = message && message.source;
    if (!source) return null;
    const parsed = await simpleParser(source);
    return toMessage(uid, parsed, message.flags);
  });
}

export function isContactInboxConfigured(): boolean {
  return Boolean(config());
}

export async function sendContactReply(to: string, subject: string, text: string): Promise<void> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  const port = Number(process.env.SMTP_PORT || 465);
  if (!host || !user || !password) throw new Error("SMTP non configuré.");
  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass: password } });
  await transporter.sendMail({ from: user, to, subject, text });
}
