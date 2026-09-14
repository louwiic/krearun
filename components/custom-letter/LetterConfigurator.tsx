"use client";

import { useEffect, useId, useState } from "react";
import dynamic from "next/dynamic";
import opentype, { type Font } from "opentype.js";
import { zipSync } from "fflate";
import { DEFAULT_LETTER, layoutCustomLetter, buildCustomLetter, arrangeCustomLetter, type LetterOptions } from "@/lib/custom-letter";
import { serializeNameplate, serializeNameplate3mf } from "@/lib/nameplate-3d";

type Layout = ReturnType<typeof layoutCustomLetter>;
const LetterPreview3D = dynamic(() => import("./LetterPreview3D"), { ssr: false });
const colors = ["#d94665", "#f4eee0", "#129e9c", "#edb83c", "#708960", "#262626"];
const inputStyle = "mt-2 w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-ink outline-none focus:border-terra";

function save(data: Uint8Array, filename: string, type = "application/zip") {
  const url = URL.createObjectURL(new Blob([new Uint8Array(data)], { type }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export default function LetterConfigurator() {
  const [options, setOptions] = useState<LetterOptions>(DEFAULT_LETTER);
  const [fonts, setFonts] = useState<[Font, Font] | null>(null);
  const [fontAttempt, setFontAttempt] = useState(0);
  const [fontError, setFontError] = useState("");
  const [layout, setLayout] = useState<Layout | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(true);
  const [baseColor, setBaseColor] = useState(colors[0]);
  const [nameColor, setNameColor] = useState(colors[1]);
  const [view, setView] = useState("assembled");
  const clip = useId().replace(/:/g, "");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all(["LibreBaskerville.ttf", "Lobster-Regular.ttf"].map(async (file) => {
      const response = await fetch(`/fonts/${file}`, { signal: controller.signal });
      if (!response.ok) throw new Error("Impossible de charger les polices.");
      return opentype.parse(await response.arrayBuffer());
    })).then(([initial, name]) => setFonts([initial, name])).catch((reason) => {
      if (!controller.signal.aborted) setFontError(reason instanceof Error ? reason.message : "Chargement impossible.");
    });
    return () => controller.abort();
  }, [fontAttempt]);

  useEffect(() => {
    if (!fonts) return;
    const timer = setTimeout(() => {
      try { setLayout(layoutCustomLetter(options, ...fonts)); setError(""); }
      catch (reason) { setLayout(null); setError(reason instanceof Error ? reason.message : "Modèle invalide."); }
      setPending(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [options, fonts]);

  function update<K extends keyof LetterOptions>(key: K, value: LetterOptions[K]) {
    setPending(true);
    setOptions((current) => ({ ...current, [key]: value }));
  }

  async function exportPieces(format: "stl" | "3mf") {
    if (!fonts || !layout || pending) return;
    setBusy(true); setError("");
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 30));
      const model = buildCustomLetter(options, ...fonts);
      const stem = `${options.initial}-${model.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9-]/g, "-")}`;
      if (format === "3mf") {
        save(serializeNameplate3mf(arrangeCustomLetter(model), { base: baseColor, letters: nameColor }), `${stem}-a-emboiter.3mf`, "model/3mf");
        return;
      }
      const [base, name] = await Promise.all([model.base, model.letters].map(async (solid) =>
        new Uint8Array(await new Blob(serializeNameplate(solid)).arrayBuffer()),
      ));
      save(zipSync({
        [`${stem}-base.stl`]: base,
        [`${stem}-prenom.stl`]: name,
        "parametres.json": new TextEncoder().encode(JSON.stringify({ ...options, baseColor, nameColor }, null, 2)),
        "assemblage.txt": new TextEncoder().encode(
          `KreaRun - ${model.name}\nDeux pieces STL, unites en millimetres. Importer comme deux objets separes et les disposer sur le plateau, dos a plat.\nLa base contient une empreinte de ${options.socketDepth} mm. Le prenom depasse de 2 mm apres insertion. Jeu lateral: ${options.clearance} mm par cote.\nVerifier le jeu avec une impression test avant la fabrication finale. Les couleurs sont indiquees dans parametres.json; le STL ne stocke pas les couleurs.\n`,
        ),
      }), `${stem}-a-emboiter.zip`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "L'export a échoué."); }
    finally { setBusy(false); }
  }

  const ranges: Array<{ key: "height" | "nameWidth" | "position"; label: string; min: number; max: number; unit: string }> = [
    { key: "height", label: "Hauteur de la lettre", min: 100, max: 220, unit: "mm" },
    { key: "nameWidth", label: "Largeur du prénom", min: 70, max: 145, unit: "%" },
    { key: "position", label: "Position verticale", min: 30, max: 70, unit: "%" },
  ];
  const bounds = layout?.bounds;
  const frame = bounds ? `${bounds[0][0] - 15} -15 ${bounds[1][0] - bounds[0][0] + 30} ${options.height + 30}` : "0 0 200 200";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-display text-3xl uppercase sm:text-4xl">Lettre personnalisée</h1>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 lg:sticky lg:top-24" aria-label="Aperçu de la lettre">
          <div className="mb-4 flex border-b border-sand" role="group" aria-label="Vue">
            {[["assembled", "Assemblage"], ["base", "Base creusée"], ["name", "Prénom"]].map(([value, label]) => (
              <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)} className={`flex-1 border-b-2 px-2 py-3 text-sm font-semibold ${view === value ? "border-terra text-ink" : "border-transparent text-ink-soft"}`}>{label}</button>
            ))}
          </div>
          <div className="relative flex aspect-square max-h-[620px] items-center justify-center rounded-lg bg-[#eef3f3] p-4" aria-busy={pending || !fonts}>
            {layout ? (
              <svg viewBox={frame} className={`h-full w-full ${pending ? "opacity-60" : ""}`} role="img" aria-label={`${options.initial} avec le prénom ${layout.name}, vue ${view === "assembled" ? "assemblée" : view === "base" ? "base creusée" : "prénom"}`}>
                <defs><clipPath id={clip}><path d={layout.initialPath} fillRule="evenodd" /></clipPath></defs>
                <g transform={`translate(0 ${options.height}) scale(1 -1)`}>
                  {view !== "name" && <path d={layout.initialPath} fill={baseColor} fillRule="evenodd" />}
                  {view === "base" && <g clipPath={`url(#${clip})`}><path d={layout.recessPath} fill="#000" fillOpacity="0.28" fillRule="evenodd" /></g>}
                  {view !== "base" && <path d={layout.namePath} fill={nameColor} stroke="#000" strokeOpacity="0.08" strokeWidth="0.3" fillRule="evenodd" />}
                </g>
              </svg>
            ) : <p className="px-6 text-center text-sm text-ink-soft">{fontError || error || "Chargement…"}</p>}
            {layout && fonts && <LetterPreview3D options={options} fonts={fonts} baseColor={baseColor} nameColor={nameColor} view={view} />}
          </div>
          {fontError && <button type="button" onClick={() => { setFontError(""); setFontAttempt((n) => n + 1); }} className="mt-3 underline">Réessayer</button>}
          <p className="mt-3 text-sm text-ink-soft">{options.height} mm de haut · {options.thickness} mm d’épaisseur · 2 pièces</p>
        </section>

        <fieldset disabled={busy} className="min-w-0 space-y-6 disabled:opacity-70">
          <div className="grid grid-cols-[85px_minmax(0,1fr)] gap-4">
            <label className="text-sm font-semibold">Initiale<select className={inputStyle} value={options.initial} onChange={(e) => update("initial", e.target.value)}>{[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((letter) => <option key={letter}>{letter}</option>)}</select></label>
            <label className="text-sm font-semibold">Prénom<input className={inputStyle} value={options.name} maxLength={18} onChange={(e) => update("name", e.target.value)} /></label>
          </div>
          {[{ label: "Lettre", selected: baseColor, setColor: setBaseColor }, { label: "Prénom", selected: nameColor, setColor: setNameColor }].map(({ label, selected, setColor }) => (
            <div key={label}><p className="mb-3 text-sm font-semibold">Couleur · {label}</p><div className="flex gap-3">
              {colors.map((color) => <button key={color} type="button" title={color} aria-label={`${label} : couleur ${color}`} aria-pressed={selected === color} onClick={() => setColor(color)} style={{ backgroundColor: color }} className={`h-8 w-8 shrink-0 rounded-full border border-black/15 ${selected === color ? "outline-2 outline-offset-3 outline-ink" : ""}`} />)}
            </div></div>
          ))}
          {ranges.map(({ key, label, min, max, unit }) => <label key={key} className="block text-sm font-semibold"><span className="flex justify-between gap-2"><span>{label}</span><span className="whitespace-nowrap font-normal">{options[key]} {unit}</span></span><input type="range" min={min} max={max} value={options[key]} onChange={(e) => update(key, Number(e.target.value))} className="mt-3 w-full accent-terra" /></label>)}
          <details className="border-y border-sand py-4"><summary className="cursor-pointer text-sm font-semibold">Emboîtement et épaisseur</summary><div className="mt-4 space-y-4">
            {([
              ["thickness", "Épaisseur de la lettre (mm)", 8, 20, 1],
              ["socketDepth", "Profondeur de l’empreinte (mm)", 1, 3, 0.1],
              ["clearance", "Jeu par côté (mm)", 0.1, 0.5, 0.05],
            ] as const).map(([key, label, min, max, step]) => <label key={key} className="block text-sm">{label}<input className={inputStyle} type="number" min={min} max={max} step={step} value={options[key]} onChange={(e) => update(key, Number(e.target.value))} /></label>)}
          </div></details>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="space-y-3">
            <button type="button" disabled={!layout || pending || !fonts || busy} onClick={() => exportPieces("3mf")} className="w-full rounded-lg bg-ink px-4 py-4 text-sm font-bold text-white disabled:opacity-50">{busy ? "Préparation…" : "Télécharger en couleurs (3MF)"}</button>
            <button type="button" disabled={!layout || pending || !fonts || busy} onClick={() => exportPieces("stl")} className="w-full rounded-lg border border-ink px-4 py-3 text-sm font-bold disabled:opacity-50">Télécharger les deux pièces (STL)</button>
          </div>
        </fieldset>
      </div>
    </div>
  );
}
