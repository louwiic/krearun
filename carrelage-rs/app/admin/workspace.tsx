"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Save,
  Printer,
  Download,
  FileImage,
  Trash2,
  LogOut,
  ClipboardList,
  MapPin,
  Search,
} from "lucide-react";
import {
  newQuote,
  sections,
  floorArea,
  roomArea,
  quantity,
  lineCents,
  totalCents,
  type Quote,
  type Room,
  type Line,
} from "@/lib/quotes";
import { logout } from "./actions";
import PlanAnalysis from "@/components/plan-analysis";
import AiUsage from "@/components/ai-usage";

const money = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
const presets = [
  "Plinthes",
  "Chape",
  "Marches",
  "Contremarches",
  "Nez de marche",
  "Douche à l’italienne",
  "Niche",
  "Tablette",
  "Banc / siège",
  "Étanchéité",
  "Faïence",
  "Fournitures",
  "Autre prestation",
];
export default function QuoteWorkspace() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [tab, setTab] = useState("questionnaire");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [planVersion, setPlanVersion] = useState(0);
  useEffect(() => {
    fetch("/api/admin/quotes")
      .then(async (r) => {
        if (!r.ok) throw Error("Impossible de charger les dossiers.");
        return r.json();
      })
      .then(setQuotes)
      .catch((e) => setMessage(e.message));
  }, []);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  function change(update: Partial<Quote>) {
    setQuote((q) => (q ? { ...q, ...update } : q));
    setDirty(true);
    setMessage("");
  }
  function open(q: Quote) {
    if (busy) return;
    if (dirty && !confirm("Abandonner les modifications non enregistrées ?"))
      return;
    setQuote(q);
    setDirty(false);
    setMessage("");
    setSelectedRoom("");
  }
  function room(id: string, update: Partial<Room>) {
    if (quote)
      change({
        rooms: quote.rooms.map((r) => (r.id === id ? { ...r, ...update } : r)),
      });
  }
  function line(id: string, update: Partial<Line>) {
    if (quote)
      change({
        lines: quote.lines.map((l) => (l.id === id ? { ...l, ...update } : l)),
      });
  }
  async function save() {
    if (!quote) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quote),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "Sauvegarde refusée.");
      setQuotes((all) => [data, ...all.filter((q) => q.id !== data.id)]);
      setQuote(data);
      setDirty(false);
      setMessage("Dossier enregistré.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur de sauvegarde.");
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5_000_000
    ) {
      setMessage("Plan : image JPG, PNG ou WebP, maximum 5 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPlanVersion((v) => v + 1);
      change({
        plan: String(reader.result),
        rooms: quote!.rooms.map((r) => ({ ...r, x: undefined, y: undefined })),
      });
    };
    reader.onerror = () => setMessage("Lecture du plan impossible.");
    reader.readAsDataURL(file);
  }
  function exportFile() {
    if (!quote) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(quote, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${quote.reference}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="rs-admin">
      <header className="rs-header no-print">
        <Link href="/">
          <img src="/site/Carrelage-RS-Logo-HD.png" alt="Carrelage RS" />
        </Link>
        <span>
          ATELIER <b>Devis & métrés</b>
        </span>
        <form action={logout}>
          <button title="Se déconnecter" aria-label="Se déconnecter">
            <LogOut size={19} />
          </button>
        </form>
      </header>
      <AiUsage />
      <div className="rs-shell">
        <aside className="rs-sidebar no-print">
          <div className="rs-row">
            <h2>Dossiers</h2>
            <span>{quotes.length}</span>
          </div>
          <button className="primary" onClick={() => open(newQuote())}>
            <Plus size={17} /> Nouveau dossier
          </button>
          <label className="rs-search">
            <Search size={16} />
            <input
              placeholder="Rechercher un client"
              aria-label="Rechercher un client"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="rs-dossiers">
            {quotes
              .filter((q) =>
                `${q.client} ${q.reference}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((q) => (
                <button
                  className={quote?.id === q.id ? "active" : ""}
                  key={q.id}
                  onClick={() => open(q)}
                >
                  <strong>{q.client || "Client à renseigner"}</strong>
                  <small>{q.reference}</small>
                  <span>{money(totalCents(q))} HT</span>
                </button>
              ))}
          </div>
        </aside>
        <main className="rs-main">
          {!quote ? (
            <div className="rs-empty">
              <ClipboardList size={42} />
              <h1>Vos projets de carrelage</h1>
              <p>
                {quotes.length
                  ? "Sélectionner un dossier"
                  : "Aucun dossier enregistré"}
              </p>
              <button className="primary" onClick={() => open(newQuote())}>
                <Plus size={18} /> Nouveau dossier
              </button>
            </div>
          ) : (
            <>
              <div className="rs-title">
                <div>
                  <p className="rs-eyebrow">MAISON NEUVE · {quote.reference}</p>
                  <h1>{quote.client || "Nouveau dossier"}</h1>
                  <p className="no-print">
                    {dirty
                      ? "Modifications non enregistrées"
                      : "Dossier de chiffrage"}
                  </p>
                </div>
                <div className="rs-actions no-print">
                  <button
                    title="Exporter le dossier JSON"
                    aria-label="Exporter le dossier JSON"
                    onClick={exportFile}
                  >
                    <Download size={18} />
                  </button>
                  <button
                    title="Imprimer le chiffrage"
                    aria-label="Imprimer le chiffrage"
                    onClick={() => window.print()}
                  >
                    <Printer size={18} />
                  </button>
                  <button className="primary" disabled={busy} onClick={save}>
                    <Save size={17} />
                    {busy ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
              </div>
              <div className="rs-client">
                {(
                  [
                    ["client", "Nom du client"],
                    ["phone", "Téléphone"],
                    ["email", "E-mail"],
                    ["address", "Adresse du chantier"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      value={quote[key]}
                      type={key === "email" ? "email" : "text"}
                      disabled={busy}
                      onChange={(e) => change({ [key]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
              <nav className="rs-tabs no-print" aria-label="Dossier">
                <button
                  aria-pressed={tab === "questionnaire"}
                  onClick={() => setTab("questionnaire")}
                >
                  <ClipboardList size={17} /> Questionnaire
                </button>
                <button
                  aria-pressed={tab === "plan"}
                  onClick={() => setTab("plan")}
                >
                  <MapPin size={17} /> Plan & pièces
                </button>
                <span>
                  {floorArea(quote).toLocaleString("fr-FR")} m² sélectionnés
                </span>
              </nav>
              <div className="rs-editor">
                <fieldset className="rs-questionnaire" disabled={busy}>
                  {tab === "plan" ? (
                    <section className="rs-section no-print">
                      <div className="rs-section-title">
                        <h2>Plan du chantier</h2>
                        <label className="rs-upload">
                          <FileImage size={17} />{" "}
                          {quote.plan ? "Remplacer" : "Ajouter une photo"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => upload(e.target.files?.[0])}
                          />
                        </label>
                      </div>
                      <div className="rs-plan-tools">
                        <details className="rs-room-picker">
                          <summary>Pièces à carreler · {quote.rooms.filter(r => r.selected).length} sélectionnée(s)</summary>
                          <div className="rs-room-options">
                            <div className="rs-row">
                              <button type="button" onClick={() => change({rooms:quote.rooms.map(r => ({...r,selected:true}))})}>Tout sélectionner</button>
                              <button type="button" onClick={() => {change({rooms:quote.rooms.map(r => ({...r,selected:false}))});setSelectedRoom("");}}>Tout désélectionner</button>
                            </div>
                            {quote.rooms.map(r => <label key={r.id}>
                              <input type="checkbox" checked={r.selected} aria-label={`Sélectionner la pièce ${r.name}`} onChange={e => {
                                room(r.id,{selected:e.target.checked});
                                if(e.target.checked) setSelectedRoom(r.id);
                                else if(selectedRoom===r.id) setSelectedRoom("");
                              }}/>{r.name}
                            </label>)}
                          </div>
                        </details>
                        {quote.rooms.some(r => r.selected) &&
                        <label>
                          Repère à placer
                          <select
                            value={quote.rooms.some(r => r.id===selectedRoom && r.selected) ? selectedRoom : ""}
                            onChange={(e) => setSelectedRoom(e.target.value)}
                          >
                            <option value="">Choisir une pièce</option>
                            {quote.rooms.filter(r => r.selected).map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        }
                      </div>
                      <PlanAnalysis
                        key={`${quote.id}:${planVersion}`}
                        plan={quote.plan}
                        disabled={busy}
                        onAdd={(rooms) => {
                          if (quote.rooms.length + rooms.length > 100) {
                            setMessage("Maximum 100 pièces par dossier.");
                            return;
                          }
                          change({ rooms: [...quote.rooms, ...rooms] });
                        }}
                      />
                      {quote.plan ? (
                        <div
                          className="rs-plan"
                          onClick={(e) => {
                            if (!quote.rooms.some(r => r.id===selectedRoom && r.selected)) return;
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            room(selectedRoom, {
                              x: ((e.clientX - rect.left) / rect.width) * 100,
                              y: ((e.clientY - rect.top) / rect.height) * 100,
                            });
                          }}
                        >
                          <img src={quote.plan} alt="Plan du chantier" />
                          {quote.rooms
                            .filter(
                              (r) => r.x !== undefined && r.y !== undefined,
                            )
                            .map((r) => (
                              <button
                                key={r.id}
                                style={{ left: `${r.x}%`, top: `${r.y}%` }}
                                title={r.name}
                                aria-label={`Sélectionner ${r.name}`}
                                className={r.selected ? "selected" : ""}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  room(r.id, { selected: !r.selected });
                                }}
                              >
                                {quote.rooms.indexOf(r) + 1}
                              </button>
                            ))}
                        </div>
                      ) : (
                        <div className="rs-plan-empty">
                          <FileImage size={36} />
                          <p>Aucun plan joint</p>
                        </div>
                      )}
                    </section>
                  ) : null}
                  <section className="rs-section">
                    <div className="rs-section-title">
                      <h2>
                        01 <span>Sols et surfaces</span>
                      </h2>
                      <button
                        type="button"
                        title="Ajouter une pièce"
                        aria-label="Ajouter une pièce"
                        onClick={() =>
                          change({
                            rooms: [
                              ...quote.rooms,
                              {
                                id: crypto.randomUUID(),
                                name: "Nouvelle pièce",
                                selected: true,
                                length: 0,
                                width: 0,
                                area: 0,
                              },
                            ],
                          })
                        }
                      >
                        <Plus size={17} />
                      </button>
                    </div>
                    <div className="rs-table-scroll">
                      <table className="rs-room-table">
                        <thead>
                          <tr>
                            <th>Pièce</th>
                            <th>Long. (m)</th>
                            <th>Larg. (m)</th>
                            <th>Surface (m²)</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {quote.rooms.map((r, i) => (
                            <tr
                              key={r.id}
                              className={r.selected ? "selected-row" : ""}
                            >
                              <td>
                                <div className="rs-room-name">
                                  <input
                                    type="checkbox"
                                    checked={r.selected}
                                    aria-label={`Carreler ${r.name}`}
                                    onChange={(e) =>
                                      room(r.id, { selected: e.target.checked })
                                    }
                                  />
                                  <span>{i + 1}</span>
                                  <input
                                    aria-label={`Nom pièce ${i + 1}`}
                                    value={r.name}
                                    onChange={(e) =>
                                      room(r.id, { name: e.target.value })
                                    }
                                  />
                                </div>
                              </td>
                              <td>
                                <input
                                  aria-label={`Longueur ${r.name}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={r.length || ""}
                                  onChange={(e) =>
                                    room(r.id, {
                                      length: Math.max(
                                        0,
                                        Number(e.target.value),
                                      ),
                                    })
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  aria-label={`Largeur ${r.name}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={r.width || ""}
                                  onChange={(e) =>
                                    room(r.id, {
                                      width: Math.max(
                                        0,
                                        Number(e.target.value),
                                      ),
                                    })
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  aria-label={`Surface ${r.name}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  readOnly={r.length > 0 && r.width > 0}
                                  value={
                                    Math.round(roomArea(r) * 100) / 100 || ""
                                  }
                                  onChange={(e) =>
                                    room(r.id, {
                                      area: Math.max(0, Number(e.target.value)),
                                    })
                                  }
                                />
                              </td>
                              <td>
                                <button
                                  type="button"
                                  title={`Supprimer ${r.name}`}
                                  aria-label={`Supprimer ${r.name}`}
                                  onClick={() =>
                                    change({
                                      rooms: quote.rooms.filter(
                                        (x) => x.id !== r.id,
                                      ),
                                    })
                                  }
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="rs-subtotal">
                      <span>Surface totale à carreler</span>
                      <strong>{floorArea(quote)} m²</strong>
                    </div>
                  </section>
                  {tab === "questionnaire" &&
                    sections.map((section, i) => (
                      <section className="rs-section" key={section.title}>
                        {i > 0 && (
                          <h2>
                            0{i + 1} <span>{section.title}</span>
                          </h2>
                        )}
                        <div className="rs-fields">
                          {section.fields.map((f) => (
                            <label key={f.key}>
                              {f.label}
                              {f.options ? (
                                <select
                                  value={quote.answers[f.key] || f.options[0]}
                                  onChange={(e) =>
                                    change({
                                      answers: {
                                        ...quote.answers,
                                        [f.key]: e.target.value,
                                      },
                                    })
                                  }
                                >
                                  {f.options.map((o) => (
                                    <option key={o}>{o}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={f.number ? "number" : "text"}
                                  min={f.number ? 0 : undefined}
                                  max={f.max}
                                  step={f.number ? "0.01" : undefined}
                                  value={quote.answers[f.key] || ""}
                                  onChange={(e) =>
                                    change({
                                      answers: {
                                        ...quote.answers,
                                        [f.key]: e.target.value,
                                      },
                                    })
                                  }
                                />
                              )}
                            </label>
                          ))}
                        </div>
                        {i === 1 && Number(quote.answers.screedDepth) > 5 && (
                          <p role="alert">
                            Épaisseur supérieure à 5 cm : corriger avant
                            sauvegarde.
                          </p>
                        )}
                      </section>
                    ))}
                </fieldset>
                <aside className="rs-pricing">
                  <div className="rs-section-title">
                    <h2>Chiffrage</h2>
                    <span>PRIX HT</span>
                  </div>
                  <fieldset disabled={busy}>
                    {quote.lines.map((l) => (
                      <div className="rs-price-line" key={l.id}>
                        <div className="rs-row">
                          <input
                            aria-label="Désignation"
                            value={l.label}
                            onChange={(e) =>
                              line(l.id, { label: e.target.value })
                            }
                          />
                          <button
                            title="Supprimer la prestation"
                            aria-label="Supprimer la prestation"
                            onClick={() =>
                              change({
                                lines: quote.lines.filter((x) => x.id !== l.id),
                              })
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <div className="rs-line-values">
                          <label>
                            Quantité
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              readOnly={l.source === "floors"}
                              value={quantity(quote, l)}
                              onChange={(e) =>
                                line(l.id, {
                                  quantity: Math.max(0, Number(e.target.value)),
                                })
                              }
                            />
                          </label>
                          <label>
                            Unité
                            <select
                              value={l.unit}
                              onChange={(e) =>
                                line(l.id, { unit: e.target.value })
                              }
                            >
                              {["m²", "ml", "unité", "forfait", "m³"].map(
                                (u) => (
                                  <option key={u}>{u}</option>
                                ),
                              )}
                            </select>
                          </label>
                          <label>
                            PU HT (€)
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={l.price || ""}
                              onChange={(e) =>
                                line(l.id, {
                                  price: Math.max(0, Number(e.target.value)),
                                })
                              }
                            />
                          </label>
                        </div>
                        <div className="rs-row">
                          <small>
                            {l.source === "floors"
                              ? "Surface des pièces sélectionnées"
                              : "Quantité saisie"}
                          </small>
                          <strong>{money(lineCents(quote, l))}</strong>
                        </div>
                      </div>
                    ))}
                    <label className="no-print rs-add">
                      Ajouter une prestation
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value)
                            change({
                              lines: [
                                ...quote.lines,
                                {
                                  id: crypto.randomUUID(),
                                  label: e.target.value,
                                  unit: ["Plinthes", "Nez de marche"].includes(
                                    e.target.value,
                                  )
                                    ? "ml"
                                    : [
                                          "Marches",
                                          "Contremarches",
                                          "Niche",
                                          "Tablette",
                                          "Banc / siège",
                                        ].includes(e.target.value)
                                      ? "unité"
                                      : [
                                            "Douche à l’italienne",
                                            "Fournitures",
                                            "Autre prestation",
                                          ].includes(e.target.value)
                                        ? "forfait"
                                        : "m²",
                                  quantity: 0,
                                  price: 0,
                                  source: "manual",
                                },
                              ],
                            });
                        }}
                      >
                        <option value="">Choisir…</option>
                        {presets.map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                    </label>
                  </fieldset>
                  <div className="rs-total">
                    <span>Total estimé HT</span>
                    <strong>{money(totalCents(quote))}</strong>
                  </div>
                  {quote.lines.some(
                    (l) => quantity(quote, l) > 0 && l.price === 0,
                  ) && (
                    <p className="rs-warning">
                      Des tarifs restent à renseigner.
                    </p>
                  )}
                  <label className="rs-notes">
                    Observations
                    <textarea
                      rows={4}
                      value={quote.notes}
                      disabled={busy}
                      onChange={(e) => change({ notes: e.target.value })}
                    />
                  </label>
                  <p className="rs-disclaimer">
                    Estimation de travaux · TVA et conditions à compléter avant
                    émission d’un devis définitif.
                  </p>
                </aside>
              </div>
            </>
          )}
          <p className="rs-message no-print" role="status">
            {message}
          </p>
        </main>
      </div>
    </div>
  );
}
