import ClickerConfigurator from "@/components/clicker/ClickerConfigurator";
import { getInventoryColors } from "@/lib/store";

export const metadata = {
  alternates: { canonical: "/clicker-studio" },
  title: "Clicker personnalisé",
  description: "Créez votre clicker personnalisé avec vos couleurs et votre symbole.",
};

export default async function Page() {
  const colors = await getInventoryColors();
  return <><div data-product-view="clicker-studio" aria-hidden className="h-px"/><ClickerConfigurator colors={colors} /></>;
}
