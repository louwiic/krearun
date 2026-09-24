import { PageShell } from "@/components/layout";
import { CtaBand, Hero, ValuesGrid } from "@/components/sections";

export const metadata = {
  title: "A propos - Carrelage RS",
};

export default function AboutPage() {
  return (
    <PageShell>
      <Hero
        title="Carrelage RS, l'art du carrelage pratique par un passionne"
        image="Apropos-002.jpg"
      />
      <section className="section split about-long">
        <div className="image-pair">
          <img src="/site/Apropos-001.jpg" alt="Carreleur sur chantier" />
          <img src="/site/Apropos-002.jpg" alt="Detail de carrelage" />
        </div>
        <div>
          <p className="eyebrow">Carrelage RS</p>
          <h2>Le mot du gerant carreleur</h2>
          <p>
            Forme et diplome comme carreleur-mosaiste en Bretagne entre 2006 et
            2009, Rodolphe Smith met son expertise au service des particuliers
            avec Carrelage RS a La Reunion.
          </p>
          <p>
            L'entreprise est specialisee dans la pose de carrelage et la
            renovation de salle de bain. Elle conseille ses clients pour
            securiser les projets, choisir les materiaux et adapter les
            solutions aux besoins, au budget et aux contraintes du chantier.
          </p>
          <p>
            Carrelage RS intervient principalement dans le sud et l'ouest de La
            Reunion, plus exceptionnellement dans le nord, avec des partenaires
            de confiance autour de l'ile. Les interventions sont couvertes par
            une garantie decennale.
          </p>
        </div>
      </section>
      <ValuesGrid />
      <CtaBand />
    </PageShell>
  );
}
