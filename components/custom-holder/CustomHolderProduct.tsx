import Link from "next/link";
import { getInventoryColors } from "@/lib/store";
import { getCustomerSession } from "@/lib/customer-auth";
import { HOLDER_NAME } from "@/lib/custom-holder";
import HolderConfigurator from "./HolderConfigurator";

export default async function CustomHolderProduct() {
  const [colors,session]=await Promise.all([getInventoryColors(),getCustomerSession()]);
  return <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
    <Link href="/boutique?categorie=porte-boisson" className="text-sm font-bold text-ink-soft">← Porte-boisson</Link>
    <p className="mt-8 text-xs font-bold uppercase tracking-widest text-terra">Votre logo. Votre porte-boisson.</p>
    <h1 className="mt-3 font-display text-4xl uppercase sm:text-5xl">{HOLDER_NAME}</h1>
    <p className="mt-4 max-w-2xl leading-7 text-ink-soft">Le format porte-canette avec poignée, pensé pour les canettes 500 ml. Importez votre logo et voyez-le directement sur le porte-boisson en 3D.</p>
    <ol className="my-8 grid gap-3 text-sm font-bold sm:grid-cols-3"><li className="rounded-xl bg-cream p-4">01 · Personnalisez et envoyez</li><li className="rounded-xl bg-cream p-4">02 · Nous validons le logo et le prix</li><li className="rounded-xl bg-cream p-4">03 · Payez dans votre espace client</li></ol>
    <HolderConfigurator colors={colors.map(({name,hex})=>({name,hex}))} signedIn={!!session}/>
  </div>;
}
