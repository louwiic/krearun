import { PageShell } from "@/components/layout";
import {
  CtaBand,
  Hero,
  Pricing,
  ProcessAndAdvice,
  ServicesGrid,
  Suppliers,
} from "@/components/sections";

export const metadata = {
  title: "Prestations - Carrelage RS",
};

export default function ServicesPage() {
  return (
    <PageShell>
      <Hero title="Nos prestations de pose de carrelage" image="Pose-de-carrelage-sol_.jpg" />
      <ServicesGrid />
      <ProcessAndAdvice />
      <Pricing />
      <Suppliers />
      <CtaBand />
    </PageShell>
  );
}
