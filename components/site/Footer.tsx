import { PrivacyPreferencesButton } from "./PrivacyPreferences";
import Link from "next/link";
import BrandLogo from "./BrandLogo";
import Newsletter from "./Newsletter";
import type { StoreCategory } from "@/lib/categories";

export default function Footer({ instagram, contactEmail, categories }: { instagram: string; contactEmail: string; categories: StoreCategory[] }) {
  return <footer className="editorial-footer">
    <div className="editorial-footer-top">
      <div><Link href="/" aria-label="Kréarun — accueil"><BrandLogo className="w-56" /></Link><p className="mt-5 max-w-xs text-sm leading-relaxed">Vos idées. Vos couleurs.<br/>Votre atelier à La Réunion.</p><a href={`mailto:${contactEmail}`} className="mt-4 inline-block break-all text-xs underline underline-offset-4">{contactEmail}</a></div>
      <div className="grid grid-cols-2 gap-7 text-sm"><div><p className="mb-5 font-bold">Boutique</p><ul className="space-y-3"><li><Link href="/boutique">Tous les objets</Link></li>{categories.map(category => <li key={category.value}><Link href={`/boutique?categorie=${category.value}`}>{category.label}</Link></li>)}</ul></div><div><p className="mb-5 font-bold">L’atelier</p><ul className="space-y-3"><li><Link href="/personnaliser">Personnaliser</Link></li><li><Link href="/lettre-personnalisee">Lettre personnalisée</Link></li><li><Link href="/clicker-studio">Clicker Studio</Link></li><li><Link href="/contact">Contact</Link></li><li><Link href="/faq">FAQ & livraison</Link></li><li><Link href="/suivi">Suivre ma commande</Link></li>{instagram && <li><a href={instagram} target="_blank" rel="noreferrer">Instagram ↗</a></li>}</ul></div></div>
      <div><h2 className="font-display text-2xl uppercase">Les nouvelles de l’atelier</h2><p className="mb-5 mt-3 text-xs leading-relaxed">Nouveautés, coulisses et idées à personnaliser.</p><Newsletter /></div>
    </div>
    <div className="editorial-footer-bottom"><p>© {new Date().getFullYear()} Kréarun</p><div><Link href="/cgv">CGV</Link><Link href="/cgu">CGU</Link><Link href="/retractation">Renoncer au contrat ici</Link><Link href="/confidentialite">Confidentialité</Link><PrivacyPreferencesButton /><Link href="/mentions-legales">Mentions légales</Link><Link href="/admin">Admin</Link></div></div>
  </footer>;
}
