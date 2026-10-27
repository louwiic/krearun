import ClickerConfigurator from "@/components/clicker/ClickerConfigurator";
import { getInventoryColors } from "@/lib/store";

export const metadata = {
  title: "Clicker Studio | KreaRun",
  description: "Créez votre clicker personnalisé avec vos couleurs et votre symbole.",
};

export default async function Page() {
  const colors = await getInventoryColors();
  return <><div data-product-view="clicker-studio" aria-hidden className="h-px"/><ClickerConfigurator colors={colors} /></>;
}
