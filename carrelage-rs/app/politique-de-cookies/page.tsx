import { PageShell } from "@/components/layout";

export const metadata = { title: "Politique de cookies - Carrelage RS" };

export default function CookiesPage() {
  return (
    <PageShell>
      <article className="legal-page">
        <h1>Politique de cookies</h1>
        <p>
          Le site peut utiliser des cookies techniques et des outils de mesure
          d'audience afin d'assurer le fonctionnement des pages et d'analyser la
          consultation du site.
        </p>
        <p>
          Vous pouvez configurer votre navigateur pour refuser ou supprimer les
          cookies. Certaines fonctionnalites peuvent alors etre limitees.
        </p>
      </article>
    </PageShell>
  );
}
