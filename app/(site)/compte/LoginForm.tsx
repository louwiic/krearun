"use client";

import { useActionState } from "react";
import { customerLoginAction } from "./actions";

const field = "w-full rounded-2xl border border-sand bg-linen px-4 py-3 text-sm outline-none focus:border-terra";

export default function LoginForm() {
  const [state, action, pending] = useActionState(customerLoginAction, {});
  return (
    <form action={action} className="mt-8 space-y-5 bg-cream p-6 shadow-soft sm:p-8">
      {state.error && <p className="bg-blush/40 px-4 py-3 text-sm font-semibold text-terra-deep">{state.error}</p>}
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold text-ink-soft">Adresse e-mail</span>
        <input className={field} name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold text-ink-soft">Mot de passe</span>
        <input className={field} name="password" type="password" autoComplete="current-password" required />
      </label>
      <button disabled={pending} className="w-full rounded-full bg-terra px-8 py-4 text-sm font-bold text-cream hover:bg-terra-deep disabled:opacity-60">
        {pending ? "Connexion…" : "Me connecter"}
      </button>
      <p className="text-center text-xs leading-5 text-ink-faint">Votre compte est créé automatiquement lors de votre première commande. Utilisez le lien reçu par e-mail pour définir votre mot de passe.</p>
    </form>
  );
}
