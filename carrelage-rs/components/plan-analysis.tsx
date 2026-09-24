"use client";
import { useEffect, useRef, useState } from "react";
import { ScanLine, Check, X } from "lucide-react";
import {
  parsePlanAnalysis,
  type PlanAnalysis as Analysis,
  type PlanRoom,
} from "@/lib/plan-analysis";
import type { Room } from "@/lib/quotes";

export default function PlanAnalysis({
  plan,
  onAdd,
  disabled,
}: {
  plan: string;
  onAdd: (rooms: Room[]) => void;
  disabled: boolean;
}) {
  const controller = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    plan: string;
    data: Analysis;
    model: string;
  } | null>(null);
  const [checked, setChecked] = useState<number[]>([]);
  useEffect(() => {
    return () => {
      controller.current?.abort();
      controller.current = null;
    };
  }, [plan]);
  async function analyze() {
    if (!plan || disabled) return;
    if (
      !confirm(
        "Envoyer cette photo du plan à OpenAI (GPT-5 mini) pour analyse ? Des frais API peuvent s’appliquer. Les mesures devront être vérifiées.",
      )
    )
      return;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setPending(true);
    setError("");
    setResult(null);
    setChecked([]);
    try {
      const response = await fetch("/api/admin/analyze-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: plan }),
        signal: abort.signal,
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.error || "Analyse impossible.");
      const data = parsePlanAnalysis(body.analysis);
      if (!abort.signal.aborted) setResult({ plan, data, model: body.model });
    } catch (e) {
      if (!abort.signal.aborted)
        setError(e instanceof Error ? e.message : "Analyse impossible.");
    } finally {
      setPending(false);
      window.dispatchEvent(new Event('ai-usage-updated'));
    }
  }
  function edit(index: number, update: Partial<PlanRoom>) {
    setResult((r) =>
      r
        ? {
            ...r,
            data: {
              ...r.data,
              rooms: r.data.rooms.map((room, i) =>
                i === index ? { ...room, ...update } : room,
              ),
            },
          }
        : r,
    );
    setChecked((all) => all.filter((i) => i !== index));
  }
  const ready = result?.plan === plan ? result : null;
  const valid = (r: PlanRoom) =>
    r.name.trim() &&
    ((r.length !== null && r.length > 0 && r.width !== null && r.width > 0) ||
      (r.area !== null && r.area > 0));
  function add() {
    if (!ready || disabled) return;
    const selected = ready.data.rooms.filter(
      (r, i) => checked.includes(i) && valid(r),
    );
    if (!selected.length) return;
    onAdd(
      selected.map((r) => ({
        id: crypto.randomUUID(),
        name: r.name,
        selected: false,
        length: r.length || 0,
        width: r.width || 0,
        area: r.area || 0,
      })),
    );
    setResult(null);
    setChecked([]);
    setError("");
  }
  return (
    <div className="rs-ai">
      <button
        type="button"
        onClick={analyze}
        disabled={!plan || disabled || pending}
      >
        <ScanLine size={17} />
        {pending ? "Analyse GPT-5 mini en cours…" : "Analyser avec GPT-5 mini"}
      </button>
      <p role="status">{error}</p>
      {ready && (
        <div className="rs-ai-review">
          <div className="rs-section-title">
            <h2>Mesures à vérifier</h2>
            <button
              type="button"
              title="Fermer les propositions"
              aria-label="Fermer les propositions"
              onClick={() => setResult(null)}
            >
              <X size={16} />
            </button>
          </div>
          <p className="rs-ai-caption">
            {ready.model} · Dimensions en mètres · Surfaces en m²
          </p>
          {ready.data.warnings.map((w, i) => (
            <p className="rs-warning" key={i}>
              {w}
            </p>
          ))}
          {!ready.data.rooms.length && (
            <p>Aucune pièce exploitable détectée.</p>
          )}
          {ready.data.rooms.map((r, i) => (
            <div className="rs-ai-room" key={i}>
              <label>
                Pièce proposée
                <input
                  value={r.name}
                  maxLength={150}
                  onChange={(e) => edit(i, { name: e.target.value })}
                />
              </label>
              <div className="rs-fields">
                {(
                  [
                    ["length", "Longueur (m)"],
                    ["width", "Largeur (m)"],
                    ["area", "Surface inscrite (m²)"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      type="number"
                      min="0"
                      max="1000000"
                      step="0.01"
                      placeholder="Inconnue"
                      value={r[key] ?? ""}
                      onChange={(e) =>
                        edit(i, {
                          [key]:
                            e.target.value === ""
                              ? null
                              : Math.min(
                                  1e6,
                                  Math.max(0, Number(e.target.value)),
                                ),
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <p>{r.note}</p>
              <label className="rs-ai-approval">
                <input
                  type="checkbox"
                  disabled={!valid(r)}
                  checked={checked.includes(i)}
                  onChange={(e) =>
                    setChecked((all) =>
                      e.target.checked
                        ? [...all, i]
                        : all.filter((x) => x !== i),
                    )
                  }
                />
                Mesures vérifiées sur le plan
              </label>
            </div>
          ))}
          <button
            type="button"
            className="primary"
            disabled={!checked.length || disabled}
            onClick={add}
          >
            <Check size={17} />
            Ajouter les {checked.length} pièces vérifiées
          </button>
          <p className="rs-ai-caption">
            Ajout sans remplacer les pièces existantes. Aucune pièce ajoutée
            n’est cochée pour le chiffrage.
          </p>
        </div>
      )}
    </div>
  );
}
