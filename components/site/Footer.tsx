import Link from "next/link";
import BrandLogo from "./BrandLogo";
import Newsletter from "./Newsletter";
import type { StoreCategory } from "@/lib/categories";

export default function Footer({
  instagram,
  contactEmail,
  categories,
}: {
  instagram: string;
  contactEmail: string;
  categories: StoreCategory[];
}) {
  return (
    <footer className="mt-24 border-t-2 border-ink bg-ink text-cream">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Link href="/" className="inline-block rounded-2xl bg-linen p-5" aria-label="Kréarun — accueil"><BrandLogo className="w-64 sm:w-80" /></Link>
        <div className="mt-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-2xl uppercase leading-none">
              Les nouvelles de l’atelier
            </p>
            <p className="mb-5 mt-3 max-w-sm text-sm text-cream/60">
              Nouveautés, coulisses et idées à personnaliser —
              jamais de spam, promis.
            </p>
            <Newsletter />
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-cream">
              Boutique
            </p>
            <ul className="space-y-2.5 text-sm text-cream/70">
              <li><Link className="hover:text-[#FF6B35]" href="/boutique">Tous les objets</Link></li>
              {categories.map((category) => (
                <li key={category.value}>
                  <Link className="hover:text-[#FF6B35]" href={`/boutique?categorie=${category.value}`}>
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-cream">
              L&apos;atelier
            </p>
            <ul className="space-y-2.5 text-sm text-cream/70">
              <li><Link className="hover:text-[#FF6B35]" href="/lettre-personnalisee">Lettre personnalisée</Link></li>
              <li><Link className="hover:text-[#FF6B35]" href="/clicker-studio">Clicker Studio</Link></li>
              <li><Link className="hover:text-[#FF6B35]" href="/faq">FAQ & livraison</Link></li>
              <li><Link className="hover:text-[#FF6B35]" href="/suivi">Suivre ma commande</Link></li>
              <li><Link className="hover:text-[#FF6B35]" href="/contact">Nous écrire</Link></li>
              {instagram && (
                <li>
                  <a className="hover:text-[#FF6B35]" href={instagram} target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                </li>
              )}
              <li>
                <a className="hover:text-[#FF6B35]" href={`mailto:${contactEmail}`}>
                  {contactEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t-2 border-cream/15 pt-6 text-xs text-cream/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Kréarun — votre atelier à La Réunion.
          </p>
          <div className="flex flex-wrap gap-5 font-bold uppercase tracking-[0.08em]">
            <Link className="hover:text-[#FF6B35]" href="/cgv">CGV</Link>
            <Link className="hover:text-[#FF6B35]" href="/confidentialite">Confidentialité</Link>
            <Link className="hover:text-[#FF6B35]" href="/mentions-legales">Mentions légales</Link>
            <Link className="hover:text-[#FF6B35]" href="/admin">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
