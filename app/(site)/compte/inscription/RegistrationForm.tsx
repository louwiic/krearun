"use client";
import { useActionState } from "react";
import { registerCustomizationAction } from "./actions";
export default function RegistrationForm() {
  const [state,action,pending]=useActionState(registerCustomizationAction,{});
  if(state.sent)return <div role="status" className="mt-8 rounded-xl bg-cream p-6 leading-7"><p className="font-bold">Vérifiez votre boîte e-mail.</p><p className="mt-3">Un lien vous permet de définir votre mot de passe. Connectez-vous ensuite à votre compte et revenez sur la page de personnalisation pour envoyer votre demande.</p></div>;
  return <form action={action} className="mt-8 space-y-5 rounded-xl bg-cream p-6">
    {state.error&&<p role="alert" className="bg-blush/30 p-3 text-sm">{state.error}</p>}
    <label className="block text-sm font-bold">Prénom et nom<input name="name" autoComplete="name" required maxLength={120} className="mt-2 w-full rounded-xl border border-sand bg-white px-4 py-3"/></label>
    <label className="block text-sm font-bold">E-mail<input name="email" type="email" autoComplete="email" required maxLength={160} className="mt-2 w-full rounded-xl border border-sand bg-white px-4 py-3"/></label>
    <button disabled={pending} className="w-full rounded-full bg-terra px-5 py-3 font-bold text-white disabled:opacity-60">{pending?'Envoi…':'Recevoir mon lien d’activation'}</button>
  </form>;
}
