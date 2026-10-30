import type { Review } from "@/lib/types";

export default function HomeReviews({ reviews }: { reviews: Review[] }) {
  const published = reviews.filter(review => review.approved);
  if (!published.length) return null;

  return (
    <section className="editorial-section" aria-labelledby="home-reviews-title">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">Avis clients</p>
      <h2 id="home-reviews-title" className="mt-3 font-display text-3xl font-bold sm:text-4xl">Vos créations, vos mots.</h2>
      <div className="mt-8 grid gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
        {published.map(review => (
          <figure key={review.id} data-review-id={review.id} className="grid min-w-0 grid-rows-[auto_1fr_auto_auto] gap-y-4 bg-transparent py-5 md:row-span-4 md:grid-rows-subgrid">
            <p className="text-lg text-ink" aria-label={`${review.rating} sur 5`}>{"★ ".repeat(review.rating).trim()}</p>
            <blockquote className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-soft">« {review.message} »</blockquote>
            {review.imageUrl ? (
              <a href={review.imageUrl} target="_blank" rel="noopener noreferrer" aria-label={`Agrandir la photo de l’avis de ${review.authorName}`} className="block h-72 overflow-hidden bg-cream focus-visible:outline-2 focus-visible:outline-offset-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- Approved customer images served by the existing media endpoint. */}
                <img src={review.imageUrl} alt={`Photo de la création reçue par ${review.authorName}`} loading="lazy" className="h-full w-full object-contain" />
              </a>
            ) : <div aria-hidden="true" />}
            <figcaption className="text-sm">
              <p className="font-bold">{review.authorName}</p>
              {review.productName && <p className="mt-1 text-xs text-ink-soft">{review.productName}</p>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
