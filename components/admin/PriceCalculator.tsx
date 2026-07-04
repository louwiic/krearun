"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";

const STORAGE_KEY = "cocon-calc-params-v1";

const field =
  "w-full rounded-2xl border border-sand bg-linen px-4 py-3 text-sm outline-none focus:border-terra";
const label = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-soft";

function num(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// Arrondi commercial : au ,90 inférieur ou à l'entier le plus proche
function arrondiCommercial(prix: number): number {
  if (prix <= 0) return 0;
  const entier = Math.round(prix);
  const finNeuf = Math.floor(prix) + 0.9;
  return Math.abs(prix - finNeuf) < Math.abs(prix - entier) ? finNeuf : entier;
}

export default function PriceCalculator() {
  // Paramètres (mémorisés dans le navigateur)
  const [plaKilo, setPlaKilo] = useState("20");
  const [machineHeure, setMachineHeure] = useState("0.25");
  const [mainOeuvreHeure, setMainOeuvreHeure] = useState("15");
  const [marge, setMarge] = useState("70");

  // Saisie par pièce
  const [poids, setPoids] = useState("");
  const [heures, setHeures] = useState("");
  const [minutes, setMinutes] = useState("");
  const [accessoires, setAccessoires] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      if (saved.plaKilo) setPlaKilo(saved.plaKilo);
      if (saved.machineHeure) setMachineHeure(saved.machineHeure);
      if (saved.mainOeuvreHeure) setMainOeuvreHeure(saved.mainOeuvreHeure);
      if (saved.marge) setMarge(saved.marge);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ plaKilo, machineHeure, mainOeuvreHeure, marge })
    );
  }, [plaKilo, machineHeure, mainOeuvreHeure, marge]);

  const coutMatiere = (num(poids) / 1000) * num(plaKilo);
  const coutMachine = num(heures) * num(machineHeure);
  const coutMainOeuvre = (num(minutes) / 60) * num(mainOeuvreHeure);
  const coutAccessoires = num(accessoires);
  const coutTotal = coutMatiere + coutMachine + coutMainOeuvre + coutAccessoires;

  const tauxMarge = num(marge) / 100;
  // Marge sur coût : prix = coût × (1 + marge)
  const prixMargeSurCout = coutTotal * (1 + tauxMarge);
  // Taux de marge commerciale : prix = coût / (1 − marge) — plafonné à 95 %
  const prixMargeCommerciale =
    tauxMarge < 0.95 ? coutTotal / (1 - Math.min(tauxMarge, 0.95)) : 0;

  const conseil = arrondiCommercial(prixMargeSurCout);
  const hasResult = coutTotal > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <div className="rounded-blob bg-cream p-7 shadow-soft">
          <h2 className="mb-5 font-display text-lg font-semibold">La pièce</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <span className={label}>Poids de la pièce (g) *</span>
              <input
                value={poids}
                onChange={(e) => setPoids(e.target.value)}
                inputMode="decimal"
                placeholder="ex. 220 (donné par le slicer)"
                className={field}
                autoFocus
              />
            </div>
            <div>
              <span className={label}>Temps d'impression (h)</span>
              <input
                value={heures}
                onChange={(e) => setHeures(e.target.value)}
                inputMode="decimal"
                placeholder="ex. 12"
                className={field}
              />
            </div>
            <div>
              <span className={label}>Temps de finition (min)</span>
              <input
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                inputMode="decimal"
                placeholder="ponçage, assemblage, emballage…"
                className={field}
              />
            </div>
            <div>
              <span className={label}>Accessoires (€)</span>
              <input
                value={accessoires}
                onChange={(e) => setAccessoires(e.target.value)}
                inputMode="decimal"
                placeholder="LED, tube en verre, visserie…"
                className={field}
              />
            </div>
          </div>
        </div>

        <div className="rounded-blob bg-cream p-7 shadow-soft">
          <h2 className="mb-1 font-display text-lg font-semibold">Vos paramètres</h2>
          <p className="mb-5 text-xs text-ink-faint">
            Mémorisés automatiquement sur cet ordinateur.
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <span className={label}>PLA (€ / kg)</span>
              <input
                value={plaKilo}
                onChange={(e) => setPlaKilo(e.target.value)}
                inputMode="decimal"
                className={field}
              />
            </div>
            <div>
              <span className={label}>Machine (€ / h)</span>
              <input
                value={machineHeure}
                onChange={(e) => setMachineHeure(e.target.value)}
                inputMode="decimal"
                className={field}
              />
              <p className="mt-1 text-[11px] text-ink-faint">
                électricité + usure de l'imprimante
              </p>
            </div>
            <div>
              <span className={label}>Votre temps (€ / h)</span>
              <input
                value={mainOeuvreHeure}
                onChange={(e) => setMainOeuvreHeure(e.target.value)}
                inputMode="decimal"
                className={field}
              />
            </div>
          </div>
          <div className="mt-5">
            <span className={label}>Marge : {num(marge).toFixed(0)} %</span>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={num(marge)}
              onChange={(e) => setMarge(e.target.value)}
              className="w-full accent-terra"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-blob bg-sage/15 p-7">
          <h2 className="mb-4 font-display text-lg font-semibold">Coût de revient</h2>
          <dl className="space-y-2 text-sm text-ink-soft">
            <div className="flex justify-between">
              <dt>Matière ({num(poids).toFixed(0)} g)</dt>
              <dd>{formatPrice(Math.round(coutMatiere * 100))}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Machine ({num(heures)} h)</dt>
              <dd>{formatPrice(Math.round(coutMachine * 100))}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Finition ({num(minutes).toFixed(0)} min)</dt>
              <dd>{formatPrice(Math.round(coutMainOeuvre * 100))}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Accessoires</dt>
              <dd>{formatPrice(Math.round(coutAccessoires * 100))}</dd>
            </div>
            <div className="flex justify-between border-t border-sage/40 pt-2 font-display text-base font-semibold text-ink">
              <dt>Total</dt>
              <dd>{formatPrice(Math.round(coutTotal * 100))}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-blob bg-cream p-7 text-center shadow-lifted">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-terra">
            Prix de vente conseillé
          </p>
          <p className="mt-3 font-display text-5xl font-semibold">
            {hasResult ? formatPrice(Math.round(conseil * 100)) : "—"}
          </p>
          {hasResult && (
            <>
              <p className="mt-2 text-xs text-ink-faint">
                coût {formatPrice(Math.round(coutTotal * 100))} + {num(marge).toFixed(0)} % de
                marge, arrondi commercial
              </p>
              <div className="mt-5 space-y-1.5 border-t border-sand/60 pt-4 text-left text-xs text-ink-soft">
                <p className="flex justify-between">
                  <span>Marge sur coût (coût × {(1 + tauxMarge).toFixed(2)})</span>
                  <strong>{formatPrice(Math.round(prixMargeSurCout * 100))}</strong>
                </p>
                <p className="flex justify-between">
                  <span>
                    Taux de marge commerciale ({num(marge).toFixed(0)} % du prix de vente)
                  </span>
                  <strong>
                    {prixMargeCommerciale > 0
                      ? formatPrice(Math.round(prixMargeCommerciale * 100))
                      : "—"}
                  </strong>
                </p>
                <p className="flex justify-between text-ink-faint">
                  <span>Bénéfice net sur le prix conseillé</span>
                  <span>{formatPrice(Math.round((conseil - coutTotal) * 100))}</span>
                </p>
              </div>
            </>
          )}
        </div>

        <p className="px-2 text-xs leading-relaxed text-ink-faint">
          💡 Le poids et le temps d'impression exacts sont affichés par votre
          slicer (Bambu Studio, Cura, PrusaSlicer…) avant chaque impression.
          Pensez à inclure ~1,50 € d'emballage dans les accessoires.
        </p>
      </div>
    </div>
  );
}
