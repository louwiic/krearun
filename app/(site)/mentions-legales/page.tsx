import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Mentions légales
      </h1>
      <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Éditeur du site</h2>
          <p className="mt-2">
            Krearun Studio — [Raison sociale à compléter]
            <br />
            [Adresse à compléter]
            <br />
            SIRET : [à compléter] · E-mail : bonjour@krearun.studio
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Hébergement</h2>
          <p className="mt-2">[Hébergeur à compléter — ex. Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA]</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Données personnelles</h2>
          <p className="mt-2">
            Les données collectées (e-mail, adresse de livraison) servent
            uniquement au traitement des commandes et, avec votre accord, à
            l'envoi de notre lettre d'information. Conformément au RGPD, vous
            disposez d'un droit d'accès, de rectification et de suppression de
            vos données : écrivez-nous à bonjour@krearun.studio.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Cookies</h2>
          <p className="mt-2">
            Ce site n'utilise pas de cookies publicitaires. Seuls des cookies
            techniques (panier, session) sont déposés, indispensables au
            fonctionnement de la boutique.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Propriété intellectuelle</h2>
          <p className="mt-2">
            Les créations, visuels, textes et modèles 3D présentés sur ce site
            sont la propriété exclusive de Krearun Studio. Toute reproduction est
            interdite sans autorisation écrite.
          </p>
        </section>
      </div>
    </div>
  );
}
