import { simpleParser } from "mailparser";

export class ColissimoRejectedError extends Error {}
type Info = { messages?: { id?: string; type?: string; messageContent?: string }[]; parcelNumber?: string };
export type ColissimoDocuments = Partial<Record<"label" | "cn23" | "proforma", string>>;
export async function parseColissimoResponse(body: Buffer, contentType: string, validation = false) {
  let info: Info | undefined;
  const documents: ColissimoDocuments = {};
  if (/application\/json/i.test(contentType)) info = JSON.parse(body.toString("utf8"));
  else if (/multipart\//i.test(contentType)) {
    const parsed = await simpleParser(Buffer.concat([
      Buffer.from(`MIME-Version: 1.0\r\nContent-Type: ${contentType.replace(/[\r\n]/g, "")}\r\n\r\n`), body,
    ]), { skipHtmlToText: true, skipTextToHtml: true });
    for (const attachment of parsed.attachments) {
      const id = (attachment.contentId || attachment.filename || "").replace(/[<>]/g, "");
      if (id === "jsonInfos" || /json/i.test(attachment.contentType)) info = JSON.parse(attachment.content.toString("utf8"));
      if (["label", "cn23", "proforma"].includes(id)) {
        if (!attachment.content.subarray(0, 5).equals(Buffer.from("%PDF-"))) throw new Error("Document Colissimo invalide.");
        documents[id as keyof ColissimoDocuments] = attachment.content.toString("base64");
      }
    }
  }
  if (!info || !Array.isArray(info.messages)) throw new Error("Réponse Colissimo illisible.");
  const errors = info.messages.filter((message) => /ERROR|ERREUR/i.test(message.type || "") || (message.id && message.id !== "0" && !/WARN|INFO/i.test(message.type || "")));
  if (errors.length) throw new ColissimoRejectedError(errors.map((message) => `${message.id || ""} : ${message.messageContent || "Requête refusée"}`).join(" · ").slice(0, 800));
  if (!info.messages.some((message) => message.id === "0")) throw new Error("Réponse Colissimo sans confirmation.");
  if (!validation && (!/^[A-Z0-9]{10,30}$/i.test(info.parcelNumber || "") || !documents.label)) throw new Error("Étiquette ou numéro de colis absent.");
  return { parcelNumber: info.parcelNumber || "", documents };
}
