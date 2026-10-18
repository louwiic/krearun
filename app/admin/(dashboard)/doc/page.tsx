import type { Metadata } from "next";
import { ADMIN_DOCUMENTS } from "@/lib/admin-documents";

export const metadata: Metadata = { title: "Doc · Admin", robots: { index: false, follow: false } };

export default function AdminDocumentsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-semibold">Doc</h1>
      <p className="mt-2 text-sm text-ink-soft">Vos documents de référence pour les envois de colis.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {ADMIN_DOCUMENTS.map((document) => {
          const href = `/api/admin/doc/${document.id}`;
          return (
            <article key={document.id} className="overflow-hidden rounded-2xl border border-sand bg-cream">
              <a href={href} target="_blank" rel="noopener noreferrer" className="block border-b border-sand bg-white p-4" aria-label={`Ouvrir ${document.title}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={href} alt={document.title} className="h-96 w-full object-contain" />
              </a>
              <div className="p-5">
                <h2 className="text-lg font-semibold">{document.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{document.description}</p>
                <p className="mt-3 break-words text-xs text-ink-faint">{document.originalFilename}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-sand px-4 py-2 text-sm font-semibold hover:bg-linen">Ouvrir</a>
                  <a href={`${href}?download=1`} download={document.filename} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream hover:bg-ink-soft">Télécharger</a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
