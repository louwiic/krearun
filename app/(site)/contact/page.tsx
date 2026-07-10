import type { Metadata } from "next";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = {
  title: "Nous écrire",
  description: "Une question, une idée de personnalisation ? Écrivez-nous.",
};

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-terra">
        On papote ?
      </p>
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        Écrivez-nous un petit mot
      </h1>
      <p className="mt-4 max-w-xl text-ink-soft">
        Question sur une commande, envie d'une couleur spéciale, idée d'objet à
        inventer ensemble… notre boîte mail est toujours ouverte. On répond
        sous 48 h, souvent moins.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <a
          href={`mailto:${settings.contact_email}`}
          className="group rounded-blob bg-cream p-8 shadow-soft transition-shadow hover:shadow-lifted"
        >
          <span className="text-3xl">💌</span>
          <p className="mt-4 font-display text-xl font-semibold group-hover:text-terra">
            Par e-mail
          </p>
          <p className="mt-1 text-sm text-ink-soft">{settings.contact_email}</p>
          <p className="mt-4 text-xs font-bold text-terra">
            Écrire maintenant →
          </p>
        </a>

        {settings.instagram ? (
          <a
            href={settings.instagram}
            target="_blank"
            rel="noreferrer"
            className="group rounded-blob bg-cream p-8 shadow-soft transition-shadow hover:shadow-lifted"
          >
            <span className="text-3xl">📸</span>
            <p className="mt-4 font-display text-xl font-semibold group-hover:text-terra">
              Sur Instagram
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Les coulisses de l'atelier, en direct de nos préparations.
            </p>
            <p className="mt-4 text-xs font-bold text-terra">Nous suivre →</p>
          </a>
        ) : (
          <div className="rounded-blob bg-cream p-8 shadow-soft">
            <span className="text-3xl">🖨️</span>
            <p className="mt-4 font-display text-xl font-semibold">
              L'atelier
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Fabrication à la commande, du lundi au vendredi.
            </p>
          </div>
        )}
      </div>

      <div className="mt-10 rounded-blob bg-sage/15 p-8">
        <p className="font-display text-lg font-semibold">
          Une commande en cours ?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Indiquez votre numéro de commande (reçu par e-mail, il commence par
          #) dans votre message : on retrouvera votre petit colis en un clin
          d'œil.
        </p>
      </div>
    </div>
  );
}
