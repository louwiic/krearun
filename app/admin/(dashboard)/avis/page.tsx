import {
  approveReviewAction,
  deleteReviewAction,
  hideReviewAction,
} from "@/app/admin/actions";
import { formatDate } from "@/lib/format";
import { getReviews } from "@/lib/store";

export default async function AdminReviewsPage() {
  const reviews = await getReviews();

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-terra">
          Modération
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Avis clients
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Les nouveaux avis restent masqués tant qu'ils ne sont pas approuvés.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-blob bg-cream p-8 text-sm text-ink-soft shadow-soft">
          Aucun avis reçu pour le moment.
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-blob bg-cream p-6 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-semibold">
                      {review.authorName}
                    </h2>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                        review.approved
                          ? "bg-sage text-cream"
                          : "bg-blush text-terra-deep"
                      }`}
                    >
                      {review.approved ? "Publié" : "En attente"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-faint">
                    {review.productName} · {review.email} · {formatDate(review.createdAt)}
                  </p>
                </div>
                <div className="text-terra" aria-label={`${review.rating} sur 5`}>
                  {"✿ ".repeat(review.rating).trim()}
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                {review.message}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {!review.approved && (
                  <form action={approveReviewAction}>
                    <input type="hidden" name="id" value={review.id} />
                    <button className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-cream hover:bg-terra">
                      Approuver
                    </button>
                  </form>
                )}
                {review.approved && (
                  <form action={hideReviewAction}>
                    <input type="hidden" name="id" value={review.id} />
                    <button className="rounded-full border border-sand px-4 py-2 text-xs font-bold text-ink-soft hover:border-terra hover:text-terra">
                      Masquer
                    </button>
                  </form>
                )}
                <form action={deleteReviewAction}>
                  <input type="hidden" name="id" value={review.id} />
                  <button className="rounded-full border border-blush px-4 py-2 text-xs font-bold text-terra hover:bg-blush/30">
                    Supprimer
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
