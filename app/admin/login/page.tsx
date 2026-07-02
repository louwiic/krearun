"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "../actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <form
      action={formAction}
      className="w-full max-w-sm rounded-blob bg-cream p-10 shadow-lifted"
    >
      <p className="font-display text-2xl font-semibold">
        Cocon<span className="text-terra">·</span>Studio
      </p>
      <p className="mb-8 mt-1 text-sm text-ink-soft">
        Espace administration
      </p>

      <input
        type="hidden"
        name="suivant"
        value={searchParams.get("suivant") ?? "/admin"}
      />

      <label className="mb-4 block">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-soft">
          E-mail
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="w-full rounded-2xl border border-sand bg-linen px-4 py-3 text-sm outline-none focus:border-terra"
        />
      </label>

      <label className="mb-6 block">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-soft">
          Mot de passe
        </span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-2xl border border-sand bg-linen px-4 py-3 text-sm outline-none focus:border-terra"
        />
      </label>

      {state?.error && (
        <p className="mb-4 rounded-xl bg-blush/40 px-4 py-2.5 text-xs font-semibold text-terra-deep">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-ink py-3.5 text-sm font-bold text-cream transition-colors hover:bg-terra disabled:opacity-60"
      >
        {pending ? "Connexion…" : "Entrer dans le cocon"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linen px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
