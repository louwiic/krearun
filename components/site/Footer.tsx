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
    <footer className="mt-24 border-t-2 border-ink bg-ink text-cream">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="font-display text-5xl uppercase leading-[0.85] text-cream sm:text-7xl">
          Krearun<span className="text-terra">.</span>
        </p>
        <div className="mt-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-2xl uppercase leading-none">
              Reste dan la boucle
            </p>
            <p className="mb-5 mt-3 max-w-sm text-sm text-cream/60">
              Nouveautés de l&apos;atelier, coulisses et bons plans péi —
              jamais de spam, promis.
            </p>
            <Newsletter />
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-terra">
              Boutique
            </p>
            <ul className="space-y-2.5 text-sm text-cream/70">
              <li><Link className="hover:text-terra" href="/boutique">Tous les objets</Link></li>
              <li><Link className="hover:text-terra" href="/boutique?categorie=veilleuses">Veilleuses & lampes</Link></li>
              <li><Link className="hover:text-terra" href="/boutique?categorie=vases">Vases</Link></li>
              <li><Link className="hover:text-terra" href="/boutique?categorie=bureau">Bureau</Link></li>
              <li><Link className="hover:text-terra" href="/boutique?categorie=salle-de-bain">Salle de bain</Link></li>
              <li><Link className="hover:text-terra" href="/boutique?categorie=deco">Décoration</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-terra">
              L&apos;atelier
            </p>
            <ul className="space-y-2.5 text-sm text-cream/70">
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

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t-2 border-cream/15 pt-6 text-xs text-cream/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Krearun Studio — fabriké péi à La Réunion.
          </p>
          <div className="flex flex-wrap gap-5 font-bold uppercase tracking-[0.08em]">
            <Link className="hover:text-terra" href="/cgv">CGV</Link>
            <Link className="hover:text-terra" href="/confidentialite">Confidentialité</Link>
            <Link className="hover:text-terra" href="/mentions-legales">Mentions légales</Link>
            <Link className="hover:text-terra" href="/admin">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
