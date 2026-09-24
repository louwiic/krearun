import { PageShell } from "@/components/layout";
import {
  AboutPreview,
  CtaBand,
  GalleryGrid,
  Hero,
  ServicesGrid,
  Stats,
  Testimonials,
  TrustBar,
} from "@/components/sections";

export default function HomePage() {
  return (
    <PageShell>
      <Hero
        title="Carrelage RS, votre entreprise de carrelage a La Reunion"
        subtitle="Pose de carrelage, pierre naturelle, faience, douche a l'italienne et renovation de piscine."
      />
      <TrustBar />
      <AboutPreview />
      <ServicesGrid compact />
      <Stats />
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Carrelage RS - Entreprise de carrelage 974</p>
          <h2>Nos realisations</h2>
          <p>Apercu des techniques de pose et des realisations clients.</p>
        </div>
        <GalleryGrid limit={9} />
      </section>
      <Testimonials />
      <CtaBand />
    </PageShell>
  );
}
