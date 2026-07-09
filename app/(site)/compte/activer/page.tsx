import Link from "next/link";
import { activateAccountAction } from "./actions";

const field =
  "w-full rounded-2xl border border-sand bg-cream px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink-faint focus:border-terra";

const ERRORS: Record<string, string> = {
  lien: "Le lien d'activation est incomplet.",
  confirm: "Les deux mots de passe ne correspondent pas.",
  short: "Le mot de passe doit contenir au moins 10 caractères.",
  invalid: "Ce lien d'activation n'est plus valide.",
};

export default async function ActivateAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string; success?: string }>;
}) {
  const { token = "", error, success } = await searchParams;

  return (
    <div className="mx-auto max-w-xl px-5 py-16 sm:px-8">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-terra">
        Espace client
      </p>
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        Définir mon mot de passe
      </h1>

      {success ? (
        <div className="mt-8 bg-cream p-6 shadow-soft">
          <p className="font-display text-2xl font-semibold">Votre compte est activé</p>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            Votre mot de passe est enregistré. L'espace client pourra maintenant
            utiliser cette connexion.
          </p>
          <Link
            href="/suivi"
            className="mt-6 inline-flex rounded-full bg-terra px-7 py-3 text-sm font-bold text-cream transition-colors hover:bg-terra-deep"
          >
            Suivre une commande
          </Link>
        </div>
      ) : (
        <form action={activateAccountAction} className="mt-8 space-y-5 bg-cream p-6 shadow-soft">
          <input type="hidden" name="token" value={token} />
          <p className="text-sm leading-6 text-ink-soft">
            Choisissez un mot de passe pour retrouver vos commandes plus tard.
            Le lien reçu par e-mail expire après 7 jours.
          </p>

          {error && (
            <p className="bg-blush/40 px-4 py-3 text-sm font-semibold text-terra-deep">
              {ERRORS[error] ?? ERRORS.invalid}
            </p>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-ink-soft">
              Mot de passe
            </span>
            <input
              className={field}
              name="password"
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-ink-soft">
              Confirmer le mot de passe
            </span>
            <input
              className={field}
              name="passwordConfirm"
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-full bg-terra px-8 py-4 text-sm font-bold text-cream transition-colors hover:bg-terra-deep"
          >
            Activer mon compte
          </button>
        </form>
      )}
    </div>
  );
}
