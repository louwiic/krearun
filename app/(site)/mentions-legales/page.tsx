import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS, BUSINESS_ADDRESS } from "@/lib/legal";

export const metadata: Metadata = {
  alternates: { canonical: "/mentions-legales" }, title: "Mentions légales" };

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
            {BUSINESS.name} — {BUSINESS.status}
            <br />
            Nom commercial : {BUSINESS.tradeName}
            <br />
            {BUSINESS_ADDRESS}
            <br />
            SIRET : {BUSINESS.siret} · E-mail : <a className="underline" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
            <br />
            Téléphone : <a className="underline" href={`tel:${BUSINESS.phoneHref}`}>{BUSINESS.phone}</a>
            <br />
            Directeur de la publication : {BUSINESS.name}
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Hébergement</h2>
          <p className="mt-2">OVHcloud — OVH SAS, 2 rue Kellermann, 59100 Roubaix, France. Téléphone : +33 9 72 10 10 07. La diffusion et la protection du site ainsi que certains médias utilisent également les services Cloudflare.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Données personnelles</h2>
          <p className="mt-2">
            Les données collectées (e-mail, adresse de livraison) servent
            uniquement au traitement des commandes et, avec votre accord, à
            l’envoi de notre lettre d’information. Conformément au RGPD, vous
            disposez d’un droit d’accès, de rectification et de suppression de
            vos données : écrivez-nous à stdcreativ974@gmail.com.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Cookies</h2>
          <p className="mt-2">
            Le fonctionnement de la boutique utilise des cookies techniques et du stockage local. La mesure d’audience et les éventuels traceurs facultatifs sont décrits dans la <Link className="underline" href="/confidentialite">politique de confidentialité</Link>. Vous pouvez modifier vos choix depuis le lien « Préférences de confidentialité » du pied de page.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Matières et fabrication</h2>
          <p className="mt-2">
            Certains objets Krearun Studio sont fabriqués à partir de PLA, un
            polymère biosourcé issu notamment d’amidon végétal. Cette matière
            est légère, rigide et adaptée aux objets décoratifs. Elle reste
            sensible aux fortes chaleurs : évitez le lave-vaisselle, l’eau
            chaude, les flammes et l’exposition prolongée en plein soleil
            derrière une vitre.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Propriété intellectuelle</h2>
          <p className="mt-2">
            Les éléments originaux du site appartiennent à leur auteur ou sont utilisés avec l’autorisation de leur titulaire. Les marques, logos et modèles appartenant à des tiers restent leur propriété. Aucun droit de propriété sur ces éléments tiers n’est revendiqué par Kréarun. Toute utilisation doit respecter les droits de leurs titulaires.
          </p>
        </section>
      </div>
    </div>
  );
}
