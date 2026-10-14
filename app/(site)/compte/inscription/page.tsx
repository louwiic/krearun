import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer-auth";
import RegistrationForm from "./RegistrationForm";
export default async function RegistrationPage() {
  if(await getCustomerSession())redirect('/compte');
  return <div className="mx-auto max-w-xl px-5 py-16"><p className="text-xs font-bold uppercase tracking-widest text-terra">Personnalisation • espace client</p><h1 className="mt-3 font-display text-4xl">Créer mon compte</h1><p className="mt-4 leading-7 text-ink-soft">Recevez un lien par e-mail pour activer votre compte. Vous pourrez envoyer votre logo, suivre notre validation et payer votre porte-boisson une fois la demande acceptée.</p><RegistrationForm/><Link href="/compte" className="mt-5 inline-flex text-sm font-bold text-terra">J’ai déjà un compte →</Link></div>;
}
