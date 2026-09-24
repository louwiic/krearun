"use client";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { UsageSummary } from "@/lib/ai-usage";
const usd = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(n);
export default function AiUsage() {
  const [data, setData] = useState<UsageSummary | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/ai-usage", { cache: "no-store" });
      if (!r.ok) throw Error();
      setData(await r.json());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const fn = () => {
      void refresh();
    };
    window.addEventListener("ai-usage-updated", fn);
    window.addEventListener("focus", fn);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener("ai-usage-updated", fn);
      window.removeEventListener("focus", fn);
    };
  }, [refresh]);
  return (
    <section className="rs-usage no-print" aria-label="Usage IA">
      <div className="rs-row">
        <h2>
          Usage IA <small>GPT-5 mini</small>
        </h2>
        <button
          title="Actualiser l’usage IA"
          aria-label="Actualiser l’usage IA"
          disabled={busy}
          onClick={refresh}
        >
          <RefreshCw size={15} />
        </button>
      </div>
      {error ? (
        <p role="alert">Usage indisponible. Actualiser pour réessayer.</p>
      ) : data ? (
        <>
          <dl>
            <div>
              <dt>Dépenses estimées · ce mois</dt>
              <dd>{usd(data.monthUsd)}</dd>
            </div>
            <div>
              <dt>Total suivi · USD</dt>
              <dd>{usd(data.totalUsd)}</dd>
            </div>
            <div>
              <dt>Analyses réussies / tentatives</dt>
              <dd>
                {data.successes} / {data.attempts}
              </dd>
            </div>
            <div>
              <dt>Tokens entrée / sortie</dt>
              <dd>
                {data.input.toLocaleString("fr-FR")} /{" "}
                {data.output.toLocaleString("fr-FR")}
              </dd>
            </div>
          </dl>
          <p>
            {data.rejected} appels refusés · {data.errors} erreurs
            {data.unknown > 0
              ? ` · ${data.unknown} coûts inconnus ou en attente (exclus des montants)`
              : ""}
          </p>
          <p>
            Estimation hors taxes des appels de ce site uniquement, depuis{" "}
            {data.since
              ? new Date(data.since).toLocaleDateString("fr-FR", {
                  timeZone: "Indian/Reunion",
                })
              : "l’activation du suivi"}
            . Ce n’est ni le solde des crédits ni la facture OpenAI.
          </p>
        </>
      ) : (
        <p role="status">Chargement de l’usage…</p>
      )}
    </section>
  );
}
