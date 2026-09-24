import Link from "next/link";
import { Facebook, Mail, Menu, Phone } from "lucide-react";
import { contact, navItems } from "@/data/site";

export function Header() {
  return (
    <header className="site-header">
      <div className="topbar">
        <a href={`tel:${contact.phone.replaceAll(" ", "")}`}>
          <Phone size={15} aria-hidden />
          {contact.phone}
        </a>
        <a href={`mailto:${contact.email}`}>
          <Mail size={15} aria-hidden />
          {contact.email}
        </a>
      </div>
      <div className="navbar">
        <Link href="/" className="brand" aria-label="Carrelage RS - Accueil">
          <img src="/site/Carrelage-RS-Logo-HD.png" alt="Carrelage RS" />
        </Link>
        <nav className="desktop-nav" aria-label="Navigation principale">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <details className="mobile-nav">
          <summary aria-label="Ouvrir le menu">
            <Menu size={22} aria-hidden />
          </summary>
          <div>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </details>
        <Link href="/contact" className="nav-cta">
          Nous contacter
        </Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <img
            src="/site/Carrelage-RS-Logo-Blanc-HD.png"
            alt="Carrelage RS"
            className="footer-logo"
          />
          <p>Votre carreleur expert construction & renovation dans le sud de l'ile.</p>
        </div>
        <div>
          <h3>Liens rapides</h3>
          <Link href="/mentions-legales">Mentions legales</Link>
          <Link href="/politique-de-confidentialite">Politique de confidentialite</Link>
          <Link href="/politique-de-cookies">Politique de cookies</Link>
        </div>
        <div>
          <h3>Coordonnees</h3>
          <a href={`tel:${contact.phone.replaceAll(" ", "")}`}>{contact.phone}</a>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href={contact.facebook} target="_blank" rel="noreferrer">
            <Facebook size={17} aria-hidden />
            Facebook
          </a>
        </div>
        <div>
          <h3>Financements</h3>
          <div className="funding-logos">
            <img src="/site/logo-region.jpg" alt="Region Reunion" />
            <img src="/site/logo-union-euro2.png" alt="Union europeenne" />
          </div>
          <p>
            Ce site a ete finance a l'aide du FEDER (REACT-UE) dans le cadre de
            la reponse de l'Union Europeenne a la pandemie COVID-19.
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© Carrelage RS 2022 - Tous droits reserves</span>
        <a href="#top">Retour haut</a>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="top">{children}</main>
      <Footer />
    </>
  );
}
