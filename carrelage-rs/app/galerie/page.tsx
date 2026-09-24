import { PageShell } from "@/components/layout";
import { BeforeAfterGrid, CtaBand, GalleryGrid, Hero } from "@/components/sections";

export const metadata = {
  title: "Galerie - Carrelage RS",
};

export default function GalleryPage() {
  return (
    <PageShell>
      <Hero title="Nos realisations a La Reunion" image="1-Escalier.jpg" />
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Carrelage RS</p>
          <h2>Le carrelage dans tous ses etats</h2>
          <p>
            Quelques realisations en pose de carrelage, pierres naturelles,
            parements, salles de bain et renovations.
          </p>
        </div>
        <GalleryGrid />
      </section>
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Chantiers</p>
          <h2>Exemples avant / apres</h2>
        </div>
        <BeforeAfterGrid />
      </section>
      <CtaBand />
    </PageShell>
  );
}
