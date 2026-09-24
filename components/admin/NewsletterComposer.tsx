"use client";

import { useActionState, useRef, useState } from "react";
import {
  sendNewsletterAction,
  uploadNewsletterImageAction,
  type SendNewsletterResult,
} from "@/app/admin/actions";
import type { RecipientMode } from "@/lib/newsletter-targeting";

type ContactOption = { email: string; ignored: boolean; subscribed: boolean; hasOrdered: boolean };

type TemplateOptions = {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  cta: string;
  ctaHref?: string;
  highlight?: string;
};

function brandedTemplate({
  eyebrow,
  title,
  paragraphs,
  cta,
  ctaHref = "https://krearun.re/boutique",
  highlight,
}: TemplateOptions) {
  return `<!doctype html>
<html lang="fr">
<body style="margin:0;padding:0;background:#efeae0;color:#16130f;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#efeae0;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:2px solid #16130f;">
        <tr><td style="padding:16px 28px;background:#16130f;color:#ffffff;">
          <span style="font-family:Impact,'Arial Black',Arial,sans-serif;font-size:30px;letter-spacing:.5px;">KREARUN<span style="color:#ff4b17;">.</span></span>
          <span style="float:right;padding-top:8px;font-size:10px;font-weight:700;letter-spacing:1.5px;color:#b8f13a;text-transform:uppercase;">fabriké péi</span>
        </td></tr>
        <tr><td style="height:7px;background:#ff4b17;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:38px 30px 20px;">
          <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:1.7px;color:#db3400;text-transform:uppercase;">${eyebrow}</p>
          <h1 style="margin:0;font-family:Impact,'Arial Black',Arial,sans-serif;font-size:42px;font-weight:400;letter-spacing:.3px;line-height:1.02;text-transform:uppercase;color:#16130f;">${title}</h1>
          ${highlight ? `<div style="margin:24px 0 0;padding:15px 18px;background:#b8f13a;border:2px solid #16130f;font-size:18px;font-weight:800;line-height:1.3;">${highlight}</div>` : ""}
        </td></tr>
        <tr><td style="padding:4px 30px 38px;font-size:16px;line-height:1.65;color:#4c463d;">
          ${paragraphs.map((paragraph) => `<p style="margin:18px 0;">${paragraph}</p>`).join("")}
          <p style="margin:30px 0 8px;text-align:center;"><a href="${ctaHref}" style="display:inline-block;background:#ff4b17;border:2px solid #16130f;box-shadow:4px 4px 0 #16130f;color:#ffffff;padding:14px 22px;font-size:14px;font-weight:800;text-decoration:none;text-transform:uppercase;">${cta} →</a></p>
        </td></tr>
        <tr><td style="padding:18px 30px;background:#16130f;color:#ffffff;font-size:12px;line-height:1.5;">
          Une création pensée et fabriquée à La Réunion.<br/>
          <a href="https://krearun.re" style="color:#b8f13a;font-weight:700;text-decoration:none;">krearun.re</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const templates = [
  {
    id: "nouveautes",
    label: "Nouveautés",
    subject: "Les nouveautés viennent d'arriver chez Krearun Studio",
    html: brandedTemplate({
      eyebrow: "Nouveautés de l’atelier",
      title: "De nouvelles créations arrivent",
      paragraphs: [
        "Bonjour,",
        "De nouvelles pièces imprimées en 3D viennent de rejoindre la boutique. Des objets imaginés et fabriqués avec soin à La Réunion.",
        "Passe voir les dernières créations avant qu’elles ne quittent l’atelier.",
      ],
      cta: "Voir les nouveautés",
    }),
  },
  {
    id: "promo",
    label: "Code promo",
    subject: "Une attention pour vous chez Krearun Studio",
    html: brandedTemplate({
      eyebrow: "Une attention pour vous",
      title: "Un code pour se faire plaisir",
      highlight: "VOTRECODE — à remplacer par votre offre",
      paragraphs: [
        "Bonjour,",
        "Pour vous remercier de suivre l’atelier, voici une petite attention à utiliser sur la boutique.",
        "Le code est valable selon les conditions indiquées dans votre offre.",
      ],
      cta: "J’en profite",
    }),
  },
  {
    id: "atelier",
    label: "Nouvelles de l'atelier",
    subject: "Les nouvelles de l'atelier Krearun",
    html: brandedTemplate({
      eyebrow: "Coulisses de fabrication",
      title: "Dans l’atelier Krearun",
      paragraphs: [
        "Bonjour,",
        "Cette semaine, on vous partage les coulisses de nos créations, les projets en cours et les prochaines idées qui arrivent sur la boutique.",
        "Ajoutez ici votre message, une photo ou un lien vers une création.",
      ],
      cta: "Passer à la boutique",
    }),
  },
];

const initialState: SendNewsletterResult = {};

export default function NewsletterComposer({ contacts, segmentCounts }: { contacts: ContactOption[]; segmentCounts: { all: number; recent: number; older: number } }) {
  const subscriberCount = segmentCounts.all;
  const [state, formAction, pending] = useActionState(sendNewsletterAction, initialState);
  const [template, setTemplate] = useState(templates[0].id);
  const [subject, setSubject] = useState(templates[0].subject);
  const [html, setHtml] = useState(templates[0].html);
  const [mode, setMode] = useState<RecipientMode>("test");
  const [selected, setSelected] = useState<string[]>([]);
  const [contactFilter, setContactFilter] = useState<"all" | "customers" | "newsletter">("all");
  const [uploadState, setUploadState] = useState("");
  const imageInput = useRef<HTMLInputElement>(null);

  function selectTemplate(templateId: string) {
    const next = templates.find((item) => item.id === templateId) ?? templates[0];
    setTemplate(next.id);
    setSubject(next.subject);
    setHtml(next.html);
  }

  async function addImage(file: File | undefined) {
    if (!file) return;
    setUploadState("Téléversement de l’image…");
    const data = new FormData();
    data.set("image", file);
    const result = await uploadNewsletterImageAction(data);
    if (!result.url) {
      setUploadState(result.error ?? "Le téléversement a échoué.");
      return;
    }
    const imageHtml = `<div style="margin:28px 0;text-align:center;"><img src="${result.url}" alt="" style="display:block;max-width:100%;height:auto;border:2px solid #16130f;margin:0 auto;" /></div>`;
    setHtml((current) =>
      /<\/body>/i.test(current)
        ? current.replace(/<\/body>/i, `${imageHtml}</body>`)
        : `${current}\n${imageHtml}`,
    );
    setUploadState("Image ajoutée au HTML.");
  }

  const field = "w-full rounded-2xl border border-sand bg-linen px-4 py-3 text-sm outline-none transition-colors focus:border-terra";

  return (
    <section className="rounded-blob bg-cream p-6 shadow-soft sm:p-7">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-terra">Composer & envoyer</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Votre prochaine newsletter</h2>
        </div>
        <span className="rounded-full bg-sage/15 px-3 py-1.5 text-xs font-bold text-sage-deep">
          {subscriberCount} destinataire{subscriberCount > 1 ? "s" : ""}
        </span>
      </div>

      <form action={formAction} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.85fr)]">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-bold text-ink-soft">Modèle de départ</p>
            <div className="flex flex-wrap gap-2">
              {templates.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectTemplate(item.id)}
                  className={`rounded-full border px-3 py-2 text-xs font-bold transition-colors ${
                    template === item.id
                      ? "border-ink bg-ink text-cream"
                      : "border-sand bg-linen text-ink-soft hover:border-terra hover:text-terra-deep"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <label className="grid gap-1.5 text-xs font-bold text-ink-soft">
            Objet de l&apos;e-mail
            <input name="subject" value={subject} onChange={(event) => setSubject(event.target.value)} required maxLength={160} className={field} />
          </label>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="newsletter-html" className="text-xs font-bold text-ink-soft">Contenu HTML</label>
              <button type="button" onClick={() => imageInput.current?.click()} className="rounded-full border border-sand bg-linen px-3 py-1.5 text-xs font-bold text-terra transition-colors hover:border-terra">
                Ajouter une image
              </button>
              <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(event) => { void addImage(event.target.files?.[0]); event.currentTarget.value = ""; }} />
            </div>
            <textarea id="newsletter-html" name="html" value={html} onChange={(event) => setHtml(event.target.value)} required rows={18} spellCheck={false} className={`${field} min-h-96 resize-y font-mono text-xs leading-relaxed`} />
            {uploadState && <p className="mt-2 text-xs font-semibold text-ink-soft">{uploadState}</p>}
          </div>

          <fieldset className="rounded-2xl border border-sand bg-linen/70 p-4">
            <legend className="px-1 text-xs font-bold text-ink-soft">Destinataires</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className={`cursor-pointer rounded-2xl border p-3 text-sm transition-colors ${mode === "test" ? "border-terra bg-cream" : "border-sand bg-linen/50 hover:border-terra/50"}`}>
                <input type="radio" name="recipientMode" value="test" checked={mode === "test"} onChange={() => setMode("test")} className="mr-2 accent-terra" />
                <span className="font-bold">E-mail de test</span>
                <span className="mt-1 block text-xs text-ink-soft">Pour vérifier avant envoi.</span>
              </label>
              <label className={`cursor-pointer rounded-2xl border p-3 text-sm transition-colors ${mode === "all" ? "border-terra bg-cream" : "border-sand bg-linen/50 hover:border-terra/50"}`}>
                <input type="radio" name="recipientMode" value="all" checked={mode === "all"} onChange={() => setMode("all")} className="mr-2 accent-terra" />
                <span className="font-bold">Tous les contacts</span>
                <span className="mt-1 block text-xs text-ink-soft">{subscriberCount} abonné{subscriberCount > 1 ? "s" : ""} ou client{subscriberCount > 1 ? "s" : ""}.</span>
              </label>
              {([ ["recent", "Commande depuis moins d’un mois", segmentCounts.recent], ["older", "Dernière commande il y a plus d’un mois", segmentCounts.older], ["custom", "Choisir les contacts", selected.length] ] as const).map(([value, label, count]) => (
                <label key={value} className={`cursor-pointer rounded-2xl border p-3 text-sm transition-colors ${mode === value ? "border-terra bg-cream" : "border-sand bg-linen/50 hover:border-terra/50"}`}>
                  <input type="radio" name="recipientMode" value={value} checked={mode === value} onChange={() => setMode(value)} className="mr-2 accent-terra" />
                  <span className="font-bold">{label}</span>
                  <span className="mt-1 block text-xs text-ink-soft">{count} contact{count > 1 ? "s" : ""}.</span>
                </label>
              ))}
            </div>
            {mode === "custom" && (
              <div className="mt-3 rounded-2xl border border-sand bg-cream p-3">
                <div className="mb-2 flex flex-wrap gap-2" aria-label="Filtrer les contacts">
                  {([ ["all", "Tous"], ["customers", "Clients du site"], ["newsletter", "Newsletter"] ] as const).map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setContactFilter(value)} aria-pressed={contactFilter === value} className={`rounded-full border px-3 py-1 text-xs font-bold ${contactFilter === value ? "border-ink bg-ink text-cream" : "border-sand text-ink-soft hover:border-terra"}`}>
                      {label}
                    </button>
                  ))}
                </div>
                {selected.map((email) => <input key={email} type="hidden" name="selectedEmails" value={email} />)}
                <div className="max-h-52 overflow-y-auto">
                  {contacts.filter((contact) => !contact.ignored && (contactFilter === "all" || (contactFilter === "customers" ? contact.hasOrdered : contact.subscribed))).map((contact) => (
                    <label key={contact.email} className="flex items-center gap-2 py-1 text-xs text-ink-soft">
                      <input type="checkbox" checked={selected.includes(contact.email)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, contact.email] : current.filter((email) => email !== contact.email))} className="accent-terra" />
                      {contact.email} <span className="text-ink-faint">({[contact.subscribed && "newsletter", contact.hasOrdered && "client site"].filter(Boolean).join(", ")})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {mode === "test" ? (
              <label className="mt-3 grid gap-1.5 text-xs font-bold text-ink-soft">
                Adresse de test
                <input name="testEmail" type="email" required maxLength={254} placeholder="vous@exemple.fr" className={field} />
              </label>
            ) : (
              <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
                <input name="confirmed" type="checkbox" required className="mt-0.5 accent-terra" />
                Je confirme l&apos;envoi de cette newsletter aux {mode === "all" ? subscriberCount : mode === "recent" ? segmentCounts.recent : mode === "older" ? segmentCounts.older : selected.length} contacts sélectionnés.
              </label>
            )}
          </fieldset>

          {state.success && <p role="status" className="rounded-2xl bg-sage/15 px-4 py-3 text-sm font-bold text-sage-deep">{state.success}</p>}
          {state.error && <p role="alert" className="rounded-2xl bg-blush/30 px-4 py-3 text-sm font-bold text-terra-deep">{state.error}</p>}
          <button disabled={pending || (mode !== "test" && (mode === "all" ? subscriberCount : mode === "recent" ? segmentCounts.recent : mode === "older" ? segmentCounts.older : selected.length) === 0)} className="rounded-full bg-terra px-6 py-3.5 text-sm font-bold text-cream transition-colors hover:bg-terra-deep disabled:cursor-not-allowed disabled:opacity-40">
            {pending ? "Envoi en cours…" : mode === "test" ? "Envoyer le test" : "Envoyer la newsletter"}
          </button>
        </div>

        <div className="min-w-0">
          <p className="mb-2 text-xs font-bold text-ink-soft">Aperçu e-mail</p>
          <div className="overflow-hidden rounded-blob border border-sand bg-linen p-2 shadow-soft">
            <iframe title="Aperçu de la newsletter" sandbox="" srcDoc={html} className="h-[680px] w-full rounded-xl bg-white" />
          </div>
        </div>
      </form>
    </section>
  );
}
