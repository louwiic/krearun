import { PageShell } from "@/components/layout";
import { contact } from "@/data/site";

export const metadata = { title: "Mentions legales - Carrelage RS" };

export default function LegalPage() {
  return (
    <PageShell>
      <article className="legal-page">
        <h1>Mentions legales</h1>
        <p>
          L'editeur du site est la societe CARRELAGE RS, immatriculee au RCS de
          Saint-Pierre sous le numero 91148425100010.
        </p>
        <p>Siege social: {contact.address}.</p>
        <p>Directeur de publication: Mr Smith Rodolphe.</p>
        <p>
          GSM: {contact.phone} - Email:{" "}
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </p>
        <p>Realisation du site d'origine: SAS Pirrha - contact@pirrha.re.</p>
      </article>
    </PageShell>
  );
}
