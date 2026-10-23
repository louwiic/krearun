"use client";

import { useEffect, useRef, useState } from "react";
import { THANK_YOU_DEFAULTS, THANK_YOU_LIMITS, THANK_YOU_LINKS, thankYouLayout, type ThankYouDrafts, type ThankYouModel, type ThankYouTexts } from "@/lib/thank-you-cards";

const storageKey = "krearun-thank-you-cards-v1";
const inputClass = "mt-2 w-full rounded-xl border border-sand bg-white px-3 py-2 text-sm text-ink outline-none focus:border-terra";
const models = [{ id: "merci", label: "Merci · fleur bleue", document: "carte-merci-1" }, { id: "essence", label: "Essence · cadeau", document: "carte-merci-2" }] as const;

export default function ThankYouCardsEditor() {
  const [model, setModel] = useState<ThankYouModel>("merci");
  const [drafts, setDrafts] = useState<ThankYouDrafts>(THANK_YOU_DEFAULTS);
  const [restored, setRestored] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [perPage, setPerPage] = useState<4 | 8>(8);
  const [quantity, setQuantity] = useState(8);
  const [cropMarks, setCropMarks] = useState(true);
  const [preview, setPreview] = useState("");
  const [previewBusy, setPreviewBusy] = useState(true);
  const [error, setError] = useState("");
  const [exportError, setExportError] = useState("");
  const [busy, setBusy] = useState(false);
  const previewUrl = useRef("");
  const texts = drafts[model];
  const layout = thankYouLayout(perPage);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      const next = structuredClone(THANK_YOU_DEFAULTS);
      for (const id of ["merci", "essence"] as const) for (const key of Object.keys(THANK_YOU_LIMITS) as (keyof ThankYouTexts)[]) {
        if (typeof saved?.[id]?.[key] === "string" && Array.from(saved[id][key]).length <= THANK_YOU_LIMITS[key]) next[id][key] = saved[id][key];
      }
      queueMicrotask(() => { setDrafts(next); setRestored(true); });
    } catch { queueMicrotask(() => { setRestored(true); setStorageError(true); }); }
  }, []);

  useEffect(() => {
    if (!restored) return;
    try { localStorage.setItem(storageKey, JSON.stringify(drafts)); }
    catch { queueMicrotask(() => setStorageError(true)); }
  }, [drafts, restored]);

  useEffect(() => {
    if (!restored) return;
    const controller = new AbortController();
    queueMicrotask(() => { setPreviewBusy(true); setError(""); });
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/admin/doc/cartes-remerciement", {
          method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
          body: JSON.stringify({ model, texts, perPage: 8, quantity: 8, cropMarks: true, format: "preview" }),
        });
        if (!response.ok) throw new Error((await response.json()).error || "Aperçu indisponible.");
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
        previewUrl.current = URL.createObjectURL(blob); setPreview(previewUrl.current);
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Aperçu indisponible.");
      } finally { if (!controller.signal.aborted) setPreviewBusy(false); }
    }, 350);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [model, texts, restored]);
  useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);

  function change(key: keyof ThankYouTexts, value: string) {
    setDrafts(current => ({ ...current, [model]: { ...current[model], [key]: value } }));
    setExportError("");
  }

  async function download() {
    setBusy(true); setExportError("");
    try {
      const response = await fetch("/api/admin/doc/cartes-remerciement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, texts, perPage, quantity, cropMarks, format: "pdf" }) });
      if (!response.ok) throw new Error((await response.json()).error || "Export indisponible.");
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `krearun-cartes-${model}-a4.pdf`; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (reason) { setExportError(reason instanceof Error ? reason.message : "Export indisponible."); }
    finally { setBusy(false); }
  }

  return (
    <section className="mt-8 rounded-2xl border-2 border-ink bg-cream p-4 sm:p-6" aria-labelledby="thank-you-title">
      <h2 id="thank-you-title" className="font-display text-2xl font-semibold">Cartes de remerciement</h2>
      <p className="mt-2 text-sm text-ink-soft">Choisissez un modèle, modifiez ses textes et exportez votre planche prête à découper. Chaque carte inclut trois QR codes : boutique, newsletter et avis.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="Modèles de carte">
        {models.map(item => <button key={item.id} type="button" aria-pressed={model === item.id} onClick={() => setModel(item.id)} className={`flex items-center gap-4 rounded-xl border-2 p-3 text-left font-semibold ${model === item.id ? "border-terra bg-white" : "border-sand hover:border-ink"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Private original documents. */}
          <img src={`/api/admin/doc/${item.document}`} alt="" width={92} height={65} className="w-20 rounded-md" />{item.label}
        </button>)}
      </div>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block text-sm font-semibold">Titre
            <textarea rows={model === "essence" ? 3 : 2} maxLength={THANK_YOU_LIMITS.heading} value={texts.heading} onChange={event => change("heading", event.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-semibold">Message {model === "essence" && "(facultatif)"}
            <textarea rows={5} maxLength={THANK_YOU_LIMITS.message} value={texts.message} onChange={event => change("message", event.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-semibold">Code promotionnel affiché
            <input maxLength={THANK_YOU_LIMITS.code} value={texts.code} onChange={event => change("code", event.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-semibold">Texte de l’offre
            <input maxLength={THANK_YOU_LIMITS.offer} value={texts.offer} onChange={event => change("offer", event.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-semibold">Signature (facultative)
            <input maxLength={THANK_YOU_LIMITS.signature} value={texts.signature} onChange={event => change("signature", event.target.value)} className={inputClass} />
          </label>
          <p className="text-xs leading-relaxed text-ink-soft">{storageError ? "L’enregistrement dans ce navigateur est indisponible. Vos textes restent utilisables jusqu’à la fermeture de la page." : "Vos textes sont conservés séparément pour chaque modèle, dans ce navigateur."} Le texte du code est imprimé sur la carte ; les réductions se gèrent dans « Codes promo ».</p>
          <button type="button" onClick={() => { if (window.confirm("Rétablir les textes d’origine pour ce modèle ?")) setDrafts(current => ({ ...current, [model]: { ...THANK_YOU_DEFAULTS[model] } })); }} className="text-xs font-semibold underline underline-offset-4">Rétablir les textes du modèle</button>
        </div>
        <div className="space-y-5 lg:sticky lg:top-5">
          <p className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-soft">Destinations des QR codes : {THANK_YOU_LINKS.map(link => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">{link.label} ↗</a>)}</p>
          <div className="relative aspect-[1748/1240] overflow-hidden rounded-xl border border-sand bg-white" aria-label="Aperçu de la carte">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG generated by the authenticated preview endpoint. */}
            {preview && <img src={preview} alt={`Aperçu de la carte ${model === "merci" ? "Merci" : "Essence"} avec vos textes`} className="h-full w-full" />}
            {previewBusy && <p role="status" className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm">Mise à jour de l’aperçu…</p>}
            {error && <p role="alert" className="absolute inset-0 flex items-center justify-center bg-white/95 p-5 text-center text-sm text-red-800">{error}</p>}
          </div>
          <fieldset className="space-y-4 rounded-xl border border-sand p-4">
            <legend className="px-2 text-sm font-bold">Planche A4</legend>
            <label className="block text-sm font-semibold">Format de la planche
              <select value={perPage} onChange={event => { const next = Number(event.target.value) as 4 | 8; setPerPage(next); setQuantity(next); }} className={inputClass}>
                <option value={8}>8 petites cartes · A4 portrait</option><option value={4}>4 grandes cartes · A4 paysage</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">Nombre total de cartes
              <input type="number" min={1} max={80} step={1} value={quantity || ""} onChange={event => setQuantity(Number(event.target.value))} className={inputClass} />
            </label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cropMarks} onChange={event => setCropMarks(event.target.checked)} />Repères de découpe</label>
            <p className="text-xs leading-relaxed text-ink-soft">{quantity > 0 && quantity <= 80 ? `${Math.ceil(quantity / perPage)} page(s) A4 · ` : ""}cartes de {layout.width.toFixed(1)} × {layout.height.toFixed(1)} mm. Imprimez en taille réelle (100 %), sans ajuster à la page.</p>
            <button type="button" onClick={download} disabled={busy || previewBusy || !!error || !Number.isInteger(quantity) || quantity < 1 || quantity > 80} className="w-full rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Préparation du PDF…" : "Télécharger la planche PDF A4"}</button>
            {exportError && <p role="alert" className="text-sm text-red-800">{exportError}</p>}
          </fieldset>
          <a href={`/api/admin/doc/${models.find(item => item.id === model)!.document}`} target="_blank" rel="noopener noreferrer" className="inline-block text-xs underline underline-offset-4">Voir le visuel d’origine ↗</a>
        </div>
      </div>
    </section>
  );
}
