import { Facebook, Mail, Phone } from "lucide-react";
import { PageShell } from "@/components/layout";
import { contact } from "@/data/site";

export const metadata = {
  title: "Contact - Carrelage RS",
};

export default function ContactPage() {
  return (
    <PageShell>
      <section className="page-title">
        <p className="eyebrow">Contact</p>
        <h1>Nous contacter</h1>
        <p>Vous avez besoin d'un renseignement ou d'un devis ? Laissez un message.</p>
      </section>
      <section className="section contact-section">
        <aside className="contact-card">
          <h2>Coordonnees</h2>
          <a href={`tel:${contact.phone.replaceAll(" ", "")}`}>
            <Phone size={18} aria-hidden />
            {contact.phone}
          </a>
          <a href={`mailto:${contact.email}`}>
            <Mail size={18} aria-hidden />
            {contact.email}
          </a>
          <a href={contact.facebook} target="_blank" rel="noreferrer">
            <Facebook size={18} aria-hidden />
            Suivez-nous sur Facebook
          </a>
          <img src="/site/Carrelage-RS-GMB-Profil-300x300.png" alt="Carrelage RS" />
        </aside>
        <form className="contact-form">
          <label>
            Nom / Prenom
            <input name="name" autoComplete="name" required />
          </label>
          <label>
            E-mail
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label>
            Telephone
            <input name="phone" autoComplete="tel" />
          </label>
          <fieldset>
            <legend>Type de projet</legend>
            <label><input type="radio" name="project" /> Construction neuve</label>
            <label><input type="radio" name="project" /> Renovation salle de bain</label>
            <label><input type="radio" name="project" /> Autre</label>
          </fieldset>
          <fieldset>
            <legend>Zone geographique du chantier</legend>
            <label><input type="checkbox" name="zone" /> Nord</label>
            <label><input type="checkbox" name="zone" /> Sud</label>
            <label><input type="checkbox" name="zone" /> Est</label>
            <label><input type="checkbox" name="zone" /> Ouest</label>
          </fieldset>
          <label>
            Demarrage du chantier
            <input name="start" />
          </label>
          <label>
            Message
            <textarea name="message" rows={6} required />
          </label>
          <label className="consent">
            <input type="checkbox" required />
            J'accepte que mes donnees personnelles soient utilisees pour me
            recontacter dans le cadre de ma demande.
          </label>
          <button type="submit" className="button button-primary">
            Envoyer
          </button>
          <p className="form-note">
            Pour connaitre et exercer vos droits, consultez la politique de
            confidentialite.
          </p>
        </form>
      </section>
    </PageShell>
  );
}
