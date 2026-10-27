import LetterConfigurator from "@/components/custom-letter/LetterConfigurator";
import { isAdmin } from "@/lib/auth";

export const metadata = {
  alternates: { canonical: "/lettre-personnalisee" },
  title: "Lettre et prénom personnalisés",
  description: "Créez votre initiale personnalisée et son prénom à emboîter.",
};

export default async function Page() {
  return <LetterConfigurator isAdmin={await isAdmin()} />;
}
