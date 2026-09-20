"use client";

import { useActionState, useRef, useState } from "react";
import {
  sendNewsletterAction,
  uploadNewsletterImageAction,
  type SendNewsletterResult,
} from "@/app/admin/actions";

const templates = [
  {
    id: "nouveautes",
    label: "Nouveautés",
    subject: "Les nouveautés viennent d'arriver chez Krearun Studio",
    html: `<h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">De nouvelles créations arrivent au studio ✿</h1>
<p style="font-size:16px;line-height:1.65;">Bonjour,</p>
<p style="font-size:16px;line-height:1.65;">De nouvelles pièces imprimées en 3D viennent de rejoindre la boutique. Des objets imaginés et fabriqués avec soin à La Réunion.</p>
<p style="margin:28px 0;text-align:center;"><a href="https://krearun.re/boutique" style="display:inline-block;background:#c07a50;color:#fdfaf4;padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:bold;">Découvrir les nouveautés</a></p>
<p style="font-size:16px;line-height:1.65;">À bientôt,<br/>Krearun Studio</p>`,
  },
  {
    id: "promo",
    label: "Code promo",
    subject: "Une attention pour vous chez Krearun Studio",
    html: `<h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">Une petite attention pour vous ✿</h1>
<p style="font-size:16px;line-height:1.65;">Bonjour,</p>
<p style="font-size:16px;line-height:1.65;">Pour vous remercier de suivre l'atelier, voici un code à utiliser sur la boutique.</p>
<div style="margin:24px 0;padding:20px;border-radius:16px;background:#f2ebde;text-align:center;"><strong style="font-size:28px;letter-spacing:2px;">VOTRECODE</strong><br/><span style="color:#a4623c;">à remplacer par votre offre</span></div>
<p style="margin:28px 0;text-align:center;"><a href="https://krearun.re/boutique" style="display:inline-block;background:#c07a50;color:#fdfaf4;padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:bold;">J'en profite</a></p>`,
  },
  {
    id: "atelier",
    label: "Nouvelles de l'atelier",
    subject: "Les nouvelles de l'atelier Krearun",
    html: `<h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">Les nouvelles de l'atelier</h1>
<p style="font-size:16px;line-height:1.65;">Bonjour,</p>
<p style="font-size:16px;line-height:1.65;">Cette semaine, on vous partage les coulisses de nos créations, les projets en cours et les prochaines idées qui arrivent sur la boutique.</p>
<p style="font-size:16px;line-height:1.65;">Ajoutez ici votre message, une photo ou un lien vers une création.</p>
<p style="margin:28px 0;text-align:center;"><a href="https://krearun.re/boutique" style="display:inline-block;background:#c07a50;color:#fdfaf4;padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:bold;">Passer à la boutique</a></p>`,
  },
];

const initialState: SendNewsletterResult = {};

export default function NewsletterComposer({ subscriberCount }: { subscriberCount: number }) {
  const [state, formAction, pending] = useActionState(sendNewsletterAction, initialState);
  const [template, setTemplate] = useState(templates[0].id);
  const [subject, setSubject] = useState(templates[0].subject);
  const [html, setHtml] = useState(templates[0].html);
  const [mode, setMode] = useState<"test" | "all">("test");
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
    setHtml((current) => `${current}\n<p style="margin:24px 0;text-align:center;"><img src="${result.url}" alt="" style="display:block;max-width:100%;height:auto;border-radius:16px;margin:0 auto;" /></p>`);
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
                <span className="font-bold">Tous les abonnés</span>
                <span className="mt-1 block text-xs text-ink-soft">{subscriberCount} contact{subscriberCount > 1 ? "s" : ""} inscrit{subscriberCount > 1 ? "s" : ""}.</span>
              </label>
            </div>
            {mode === "test" ? (
              <label className="mt-3 grid gap-1.5 text-xs font-bold text-ink-soft">
                Adresse de test
                <input name="testEmail" type="email" required maxLength={254} placeholder="vous@exemple.fr" className={field} />
              </label>
            ) : (
              <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
                <input name="confirmed" type="checkbox" required className="mt-0.5 accent-terra" />
                Je confirme l&apos;envoi de cette newsletter aux {subscriberCount} abonnés.
              </label>
            )}
          </fieldset>

          {state.success && <p role="status" className="rounded-2xl bg-sage/15 px-4 py-3 text-sm font-bold text-sage-deep">{state.success}</p>}
          {state.error && <p role="alert" className="rounded-2xl bg-blush/30 px-4 py-3 text-sm font-bold text-terra-deep">{state.error}</p>}
          <button disabled={pending || (mode === "all" && subscriberCount === 0)} className="rounded-full bg-terra px-6 py-3.5 text-sm font-bold text-cream transition-colors hover:bg-terra-deep disabled:cursor-not-allowed disabled:opacity-40">
            {pending ? "Envoi en cours…" : mode === "test" ? "Envoyer le test" : `Envoyer à ${subscriberCount} abonnés`}
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
