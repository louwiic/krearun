import PriceCalculator from "@/components/admin/PriceCalculator";

export default function CalculateurPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-semibold">
        Calculateur de prix
      </h1>
      <p className="mb-8 mt-1 text-sm text-ink-soft">
        Entrez le poids de la pièce (et le reste si vous l'avez) : le prix de
        revente s'affiche en direct.
      </p>
      <PriceCalculator />
    </div>
  );
}
