import { PageShell } from "@/components/layout";
import { contact } from "@/data/site";

export const metadata = { title: "Politique de confidentialite - Carrelage RS" };

export default function PrivacyPage() {
  return (
    <PageShell>
      <article className="legal-page">
        <h1>Politique de confidentialite</h1>
        <p>
          Les informations transmises via le formulaire de contact sont utilisees
          uniquement pour repondre a la demande de renseignement ou de devis.
        </p>
        <p>
          Les donnees peuvent inclure le nom, l'adresse e-mail, le telephone, la
          zone geographique du chantier, le type de projet et le message.
        </p>
        <p>
          Pour toute demande d'acces, de rectification ou de retrait du
          consentement, contactez Carrelage RS a{" "}
          <a href={`mailto:${contact.email}`}>{contact.email}</a>.
        </p>
      </article>
    </PageShell>
  );
}
