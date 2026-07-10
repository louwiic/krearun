import Link from "next/link";
import Newsletter from "./Newsletter";

export default function Footer({
  instagram,
  contactEmail,
}: {
  instagram: string;
  contactEmail: string;
}) {
  return (
    <footer className="mt-24 border-t border-sand/60 bg-linen-deep/60">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-2xl font-semibold">
              Des nouvelles douces, de temps en temps
            </p>
            <p className="mb-5 mt-2 max-w-sm text-sm text-ink-soft">
              Nouveautés de l'atelier, coulisses et petites
              attentions — jamais de spam, promis.
            </p>
            <Newsletter />
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-ink-faint">
              Boutique
            </p>
            <ul className="space-y-2.5 text-sm text-ink-soft">
              <li><Link className="hover:text-terra" href="/boutique">Tous les objets</Link></li>
              <li><Link className="hover:text-terra" href="/boutique?categorie=veilleuses">Veilleuses & lampes</Link></li>
              <li><Link className="hover:text-terra" href="/boutique?categorie=vases">Vases</Link></li>
              <li><Link className="hover:text-terra" href="/boutique?categorie=bureau">Bureau</Link></li>
              <li><Link className="hover:text-terra" href="/boutique?categorie=salle-de-bain">Salle de bain</Link></li>
              <li><Link className="hover:text-terra" href="/boutique?categorie=deco">Décoration</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-ink-faint">
              L'atelier
            </p>
            <ul className="space-y-2.5 text-sm text-ink-soft">
              <li><Link className="hover:text-terra" href="/a-propos">Notre histoire</Link></li>
              <li><Link className="hover:text-terra" href="/faq">FAQ & livraison</Link></li>
              <li><Link className="hover:text-terra" href="/suivi">Suivre ma commande</Link></li>
              <li><Link className="hover:text-terra" href="/contact">Nous écrire</Link></li>
              {instagram && (
                <li>
                  <a className="hover:text-terra" href={instagram} target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                </li>
              )}
              <li>
                <a className="hover:text-terra" href={`mailto:${contactEmail}`}>
                  {contactEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-sand/60 pt-6 text-xs text-ink-faint sm:flex-row">
          <p>
            © {new Date().getFullYear()} Krearun Studio — objets fabriqués avec
            amour, lentement.
          </p>
          <div className="flex gap-5">
            <Link className="hover:text-ink" href="/cgv">CGV</Link>
            <Link className="hover:text-ink" href="/confidentialite">Confidentialité</Link>
            <Link className="hover:text-ink" href="/mentions-legales">Mentions légales</Link>
            <Link className="hover:text-ink" href="/admin">Espace admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
