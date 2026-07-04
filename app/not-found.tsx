import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="animate-float text-6xl">🌙</div>
      <h1 className="mt-8 font-display text-4xl font-semibold">
        Cette page fait la sieste
      </h1>
      <p className="mt-3 max-w-sm text-ink-soft">
        Elle n'existe pas, ou elle a été rangée ailleurs avec beaucoup de
        douceur.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-terra px-8 py-4 text-sm font-bold text-cream transition-colors hover:bg-terra-deep"
      >
        Revenir à l'accueil
      </Link>
    </div>
  );
}
