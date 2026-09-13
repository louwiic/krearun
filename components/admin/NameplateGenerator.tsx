"use client";

import { useEffect, useMemo, useState } from "react";
import { zipSync } from "fflate";
import type { Font } from "opentype.js";
import {
  buildNameplateModel,
  calculateNameplateLayout,
  DEFAULT_NAMEPLATE_OPTIONS,
  loadNameplateFont,
  serializeNameplate,
  serializeNameplate3mf,
  type NameplateOptions,
} from "@/lib/nameplate-3d";

const field = "mt-1.5 w-full rounded-xl border border-sand bg-linen px-4 py-3 text-sm outline-none focus:border-terra";
const label = "block text-xs font-bold uppercase tracking-wide text-ink-soft";

function numberValue(value: string) {
  return Number.parseFloat(value.replace(",", "."));
}

function bytes(parts: Array<ArrayBuffer | string>) {
  const blob = new Blob(parts, { type: "model/stl" });
  return blob.arrayBuffer().then((buffer) => new Uint8Array(buffer));
}

function download(data: BlobPart[], filename: string, type: string) {
  const url = URL.createObjectURL(new Blob(data, { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export default function NameplateGenerator() {
  const [options, setOptions] = useState<NameplateOptions>(DEFAULT_NAMEPLATE_OPTIONS);
  const [font, setFont] = useState<Font | null>(null);
  const [fontError, setFontError] = useState("");
  const [baseColor, setBaseColor] = useState("#16130f");
  const [textColor, setTextColor] = useState("#ff4b17");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    loadNameplateFont()
      .then((loaded) => {
        if (active) setFont(loaded);
      })
      .catch((error) => {
        if (active) setFontError(error instanceof Error ? error.message : "Impossible de charger la police.");
      });
    return () => { active = false; };
  }, []);

  const result = useMemo(() => {
    if (!font) return { model: null, error: fontError || "Chargement de la police…" };
    try {
      return { model: calculateNameplateLayout(options, font), error: "" };
    } catch (error) {
      return { model: null, error: error instanceof Error ? error.message : "Paramètres invalides." };
    }
  }, [font, fontError, options]);

  const updateNumber = (key: keyof NameplateOptions, value: string) =>
    setOptions((current) => ({ ...current, [key]: numberValue(value) }));
  const filename = (result.model?.printableName || "prenom").toLowerCase().replace(/[^a-z0-9]+/g, "-");

  async function exportPack() {
    if (!result.model || !font) return;
    setBusy(true);
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const generated = buildNameplateModel(options, font);
      const [base, letters] = await Promise.all([
        bytes(serializeNameplate(generated.base)),
        bytes(serializeNameplate(generated.letters)),
      ]);
      const archive = zipSync({
        [`${filename}-fond.stl`]: base,
        [`${filename}-lettres.stl`]: letters,
        "LISEZ-MOI.txt": new TextEncoder().encode(
          "Importez les deux STL ensemble dans Bambu Studio comme un objet à plusieurs pièces. Assignez ensuite une couleur au fond et une autre aux lettres. Les fichiers sont déjà alignés et en millimètres.",
        ),
      });
      download([archive], `${filename}-krearun-2-couleurs.zip`, "application/zip");
    } finally {
      setBusy(false);
    }
  }

  async function export3mf() {
    if (!result.model || !font) return;
    setBusy(true);
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const generated = buildNameplateModel(options, font);
      const file = serializeNameplate3mf(generated, { base: baseColor, letters: textColor });
      download([file], `${filename}-krearun-couleurs.3mf`, "model/3mf");
    } finally {
      setBusy(false);
    }
  }

  async function exportCombined() {
    if (!result.model || !font) return;
    setBusy(true);
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const generated = buildNameplateModel(options, font);
      download(serializeNameplate(generated.combined), `${filename}-complet.stl`, "model/stl");
    } finally {
      setBusy(false);
    }
  }

  const model = result.model;
  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-blob bg-cream p-6 shadow-soft sm:p-7">
        <h2 className="font-display text-xl">Créer le prénom</h2>
        <div className="mt-5 space-y-5">
          <label className={label}>
            Prénom
            <input
              value={options.name}
              onChange={(event) => setOptions((current) => ({ ...current, name: event.target.value }))}
              maxLength={24}
              className={`${field} text-lg normal-case`}
              autoFocus
            />
          </label>
          {result.model && result.model.printableName !== options.name.trim() && (
            <p className="-mt-3 text-xs text-ink-faint">
              Version imprimée : <strong className="text-ink">{result.model.printableName}</strong> (certains caractères non imprimables ont été retirés).
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>Largeur maximale (mm)<input type="number" min="20" max="85.9" step="0.1" value={options.maxWidth} onChange={(event) => updateNumber("maxWidth", event.target.value)} className={field} /></label>
            <label className={label}>Hauteur maximale (mm)<input type="number" min="8" max="60" step="0.1" value={options.maxHeight} onChange={(event) => updateNumber("maxHeight", event.target.value)} className={field} /></label>
            <label className={label}>Fond plat (mm)<input type="number" min="0.6" max="4" step="0.1" value={options.baseThickness} onChange={(event) => updateNumber("baseThickness", event.target.value)} className={field} /></label>
            <label className={label}>Relief lettres (mm)<input type="number" min="0.3" max="4" step="0.1" value={options.reliefHeight} onChange={(event) => updateNumber("reliefHeight", event.target.value)} className={field} /></label>
            <label className={label}>Contour autour des lettres (mm)<input type="number" min="0.8" max="4" step="0.1" value={options.contourWidth} onChange={(event) => updateNumber("contourWidth", event.target.value)} className={field} /></label>
          </div>
        </div>
        <div className="mt-6 rounded-xl bg-linen p-4 text-xs leading-relaxed text-ink-soft">
          <strong className="text-ink">Réglage conseillé pour le porte Monster :</strong> 75 × 22 mm, fond 1,2 mm et relief 0,8 mm. La largeur est limitée à 85,9 mm pour rester dans la dimension indiquée de l’objet.
        </div>
      </section>

      <section className="min-w-0 rounded-blob bg-cream p-6 shadow-soft sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="font-display text-xl">Aperçu avant export</h2><p className="mt-1 text-xs text-ink-faint">Vue de face · le STL est généré en millimètres</p></div>
          <div className="flex gap-3">
            <label className="text-xs font-semibold text-ink-soft">Base / contour <input type="color" value={baseColor} onChange={(event) => setBaseColor(event.target.value)} className="ml-2 h-8 w-10 align-middle" /></label>
            <label className="text-xs font-semibold text-ink-soft">Lettres <input type="color" value={textColor} onChange={(event) => setTextColor(event.target.value)} className="ml-2 h-8 w-10 align-middle" /></label>
          </div>
        </div>
        {model ? (
          <>
            <div className="mt-6 flex min-h-72 items-center justify-center overflow-hidden rounded-xl border border-sand bg-linen p-6">
              <svg viewBox={`0 0 ${model.width} ${model.height}`} className="max-h-72 w-full overflow-visible" role="img" aria-label={`Aperçu 3D du prénom ${model.printableName}`}>
                <g transform={`translate(0 ${model.height}) scale(1 -1)`} strokeLinecap="round" strokeLinejoin="round">
                  <path d={model.previewBasePath} fill={baseColor} stroke={baseColor} strokeWidth={options.contourWidth * 2} />
                  <path d={model.previewPath} fill={textColor} fillRule="evenodd" />
                </g>
              </svg>
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-linen p-3"><dt className="text-[10px] font-bold uppercase text-ink-faint">Largeur</dt><dd className="mt-1 font-display text-xl">{model.width.toFixed(1)} mm</dd></div>
              <div className="rounded-xl bg-linen p-3"><dt className="text-[10px] font-bold uppercase text-ink-faint">Hauteur</dt><dd className="mt-1 font-display text-xl">{model.height.toFixed(1)} mm</dd></div>
              <div className="rounded-xl bg-linen p-3"><dt className="text-[10px] font-bold uppercase text-ink-faint">Profondeur</dt><dd className="mt-1 font-display text-xl">{model.depth.toFixed(1)} mm</dd></div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={export3mf} disabled={busy} className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream hover:bg-terra disabled:opacity-50">{busy ? "Création…" : "Exporter le 3MF en couleurs"}</button>
              <button type="button" onClick={exportPack} disabled={busy} className="rounded-full border border-sand px-5 py-3 text-sm font-bold hover:bg-linen disabled:opacity-50">Kit 2 STL (.zip)</button>
              <button type="button" onClick={exportCombined} disabled={busy} className="rounded-full border border-sand px-5 py-3 text-sm font-bold hover:bg-linen disabled:opacity-50">Exporter en un seul STL</button>
            </div>
            <p className="mt-3 text-xs text-ink-faint">Le 3MF conserve les coloris choisis et les deux pièces déjà alignées. Le kit ZIP reste disponible si vous préférez travailler avec deux STL.</p>
          </>
        ) : <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{result.error}</p>}
      </section>
    </div>
  );
}
