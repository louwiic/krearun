import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Award, BadgeCheck, Clock, Hammer, ShieldCheck, Sparkles } from "lucide-react";
import { beforeAfter, gallery, services, suppliers, values } from "@/data/site";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function Hero({
  title,
  subtitle,
  image = "Accueil-Apropos-002.jpg",
}: {
  title: string;
  subtitle?: string;
  image?: string;
}) {
  return (
    <section className="hero">
      <img src={`/site/${image}`} alt="" className="hero-bg" />
      <div className="hero-overlay" />
      <div className="hero-content">
        <Eyebrow>Carrelage RS - Carreleur 974</Eyebrow>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
        <Link href="/contact" className="button button-primary">
          Nous contacter
        </Link>
      </div>
    </section>
  );
}

export function TrustBar() {
  const items: Array<[string, string, LucideIcon]> = [
    ["Conseil & accompagnement", "Dans le respect du projet et du client.", Sparkles],
    ["Devis gratuit & rapide", "Construit avec precision pour un tarif coherent.", Clock],
    ["Travail qualitatif & durable", "Effectue par des carreleurs qualifies.", BadgeCheck],
    ["Assurance decennale", "Carrelage et renovation complete de salle de bain.", ShieldCheck],
  ];

  return (
    <section className="trust-bar" aria-label="Engagements">
      {items.map(([title, text, Icon]) => (
        <article key={title}>
          <Icon size={24} aria-hidden />
          <h3>{title}</h3>
          <p>{text}</p>
        </article>
      ))}
    </section>
  );
}

export function ServicesGrid({ compact = false }: { compact?: boolean }) {
  return (
    <section className="section">
      <div className="section-heading">
        <Eyebrow>Carrelage RS</Eyebrow>
        <h2>Nos services</h2>
        <p>
          Une gamme de prestations pour embellir les espaces interieurs et
          exterieurs, du support jusqu'aux finitions.
        </p>
      </div>
      <div className={compact ? "services-grid compact" : "services-grid"}>
        {services.map((service) => (
          <article className="service-card" key={service.title}>
            <img src={`/site/${service.image}`} alt={service.title} />
            <div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AboutPreview() {
  return (
    <section className="section split">
      <div className="image-pair">
        <img src="/site/Accueil-Apropos-001.jpg" alt="Chantier de carrelage" />
        <img src="/site/Accueil-Apropos-002.jpg" alt="Pose de carrelage" />
      </div>
      <div>
        <Eyebrow>Entreprise de carrelage a La Reunion</Eyebrow>
        <h2>Poser du carrelage, c'est tout un art.</h2>
        <p>
          Carrelage RS intervient sur les projets neufs et les renovations avec
          une expertise particuliere pour les douches a l'italienne, les sols
          grands formats et la pierre naturelle.
        </p>
        <ul className="check-list">
          <li>Sols grands formats</li>
          <li>Douche a l'italienne</li>
          <li>Pierre naturelle</li>
        </ul>
        <Link href="/a-propos" className="button button-secondary">
          A propos
        </Link>
      </div>
    </section>
  );
}

export function Stats() {
  const stats = [
    ["16+", "ans d'experience"],
    ["98%", "clients satisfaits"],
    ["200+", "chantiers a La Reunion et en metropole"],
    ["48 h", "delai de reponse maximum"],
  ];

  return (
    <section className="stats-band">
      <div>
        <Eyebrow>Carreleur a La Reunion</Eyebrow>
        <h2>Pourquoi nous choisir ?</h2>
        <p>
          Faire appel a Carrelage RS, c'est choisir la fiabilite, la creativite
          et la qualite d'execution pour un projet traite comme unique.
        </p>
      </div>
      <div className="stats-grid">
        {stats.map(([value, label]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export function GalleryGrid({ limit }: { limit?: number }) {
  const items = typeof limit === "number" ? gallery.slice(0, limit) : gallery;

  return (
    <div className="gallery-grid">
      {items.map(([title, image]) => (
        <figure key={image}>
          <img src={`/site/${image}`} alt={title} />
          <figcaption>{title}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export function BeforeAfterGrid() {
  return (
    <div className="before-after">
      {beforeAfter.map(([title, image]) => (
        <figure key={image}>
          <img src={`/site/${image}`} alt={title} />
        </figure>
      ))}
    </div>
  );
}

export function Testimonials() {
  const testimonials = [
    [
      "Dorothy R",
      "Entreprise tres serieuse, travail soigne et resultat impeccable sur une pose de grands carreaux.",
    ],
    [
      "Gwen S",
      "Un professionnel a l'ecoute, passionne par son metier et attentif a la satisfaction client.",
    ],
    [
      "Sandra T",
      "Professionnalisme et efficacite au rendez-vous. Une intervention que je recommande.",
    ],
  ];

  return (
    <section className="section testimonials">
      <div className="section-heading">
        <Eyebrow>Temoignages</Eyebrow>
        <h2>Ce que les clients pensent de nous</h2>
      </div>
      <div className="testimonial-grid">
        {testimonials.map(([name, text]) => (
          <article key={name}>
            <p>{text}</p>
            <strong>{name}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ValuesGrid() {
  return (
    <section className="section">
      <div className="section-heading">
        <Eyebrow>Carrelage RS</Eyebrow>
        <h2>Nos valeurs</h2>
        <p>Pour chaque projet, Carrelage RS s'engage a defendre ses valeurs.</p>
      </div>
      <div className="values-grid">
        {values.map((value) => (
          <article key={value.title}>
            <Award size={25} aria-hidden />
            <h3>{value.title}</h3>
            <p>{value.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ProcessAndAdvice() {
  const steps = [
    "Nous prenons contact avec vous pour fixer un rendez-vous.",
    "Vous transmettez les informations et l'adresse complete du projet.",
    "Nous etudions avec vous, sur place, les details du projet.",
    "Nous transmettons un devis sous 48 h ouvrables.",
  ];
  const advice = [
    "Choisir le bon format: grand format, rectangle, pose pierre, tiers ou chevron.",
    "Prevoir un carrelage antiderapant ou semi-antiderapant pour les exterieurs.",
    "Adapter la matiere selon l'usage interieur, exterieur, garage ou plage piscine.",
    "Entretenir les pierres naturelles avec un traitement hydrofuge a renouveler.",
    "Privilegier des coloris intemporels pour une satisfaction durable.",
    "Dimensionner une douche italienne confortable et fonctionnelle.",
  ];

  return (
    <section className="section process-advice">
      <div>
        <Eyebrow>Carrelage RS - Carreleur a La Reunion</Eyebrow>
        <h2>Comment intervenons-nous ?</h2>
        <ol className="steps">
          {steps.map((step, index) => (
            <li key={step}>
              <span>Etape {index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
      <div>
        <Eyebrow>Construction neuve ou renovation</Eyebrow>
        <h2>Quelques conseils</h2>
        <ul className="advice-list">
          {advice.map((item) => (
            <li key={item}>
              <Hammer size={18} aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Pricing() {
  const plans = [
    {
      price: "25 euros/m2",
      items: [
        "Analyse du support murs et sols",
        "Devis sous 48 h ouvrables",
        "Main-d'oeuvre uniquement pour carrelage inferieur a 60 x 60 cm",
      ],
    },
    {
      price: "35 euros/m2",
      items: [
        "Analyse du support murs et sols",
        "Devis sous 48 h ouvrables",
        "Main-d'oeuvre pour carrelage inferieur a 60 x 60 cm",
        "Fourniture de colle adaptee",
        "Fourniture de joint, couleur au choix",
      ],
    },
  ];

  return (
    <section className="section pricing">
      <div className="section-heading">
        <Eyebrow>Nos tarifs</Eyebrow>
        <h2>Des prix competitifs</h2>
        <p>Deux tarifs au m2 sont proposes selon la prestation retenue.</p>
      </div>
      <div className="pricing-grid">
        {plans.map((plan) => (
          <article key={plan.price}>
            <strong>{plan.price}</strong>
            <span>Tarif a partir de</span>
            <ul>
              {plan.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Suppliers() {
  return (
    <section className="section suppliers">
      <div className="section-heading">
        <Eyebrow>Carrelage RS</Eyebrow>
        <h2>Nos fournisseurs</h2>
      </div>
      <div className="supplier-grid">
        {suppliers.map(([name, image]) => (
          <img key={name} src={`/site/${image}`} alt={name} />
        ))}
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="cta-band">
      <h2>Vous avez un projet neuf ou de renovation a realiser ?</h2>
      <Link href="/contact" className="button button-primary">
        Nous contacter
      </Link>
    </section>
  );
}
