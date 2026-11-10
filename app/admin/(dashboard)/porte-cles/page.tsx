import Link from "next/link";
import KeychainConfigurator from "@/components/keychains/KeychainConfigurator";
import { getInventoryColors, listKeychainFiles } from "@/lib/store";
import { keychainLabel } from "@/lib/name-keychain";
export const dynamic="force-dynamic";
export default async function AdminKeychainsPage(){
  const [inventory,files]=await Promise.all([getInventoryColors({includeInactive:true}),listKeychainFiles()]);
  return <div className="mx-auto max-w-6xl"><h1 className="font-display text-3xl font-bold">Porte-clés prénom</h1><p className="mb-8 mt-3 text-sm text-ink-soft">Générez vos créations ou retrouvez les fichiers des commandes clients. Tarif boutique : 12 € livraison incluse.</p><KeychainConfigurator inventory={inventory} admin/>
    <section className="mt-12"><h2 className="font-display text-2xl font-bold">Fichiers de fabrication</h2><p className="mt-2 text-sm text-ink-soft">100 fichiers les plus récents. Les fichiers 3MF contiennent le fond avec son œillet et les lettres, avec les couleurs choisies.</p><div className="mt-5 space-y-3">{files.map(file=><article key={file.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-sand bg-cream p-4"><div className="min-w-0 flex-1"><p className="font-bold">{keychainLabel(file.configuration)}</p><p className="mt-1 text-xs text-ink-soft">Fond : {file.configuration.baseColorName} · Prénom : {file.configuration.textColorName}</p>{file.orderId?<Link href={`/admin/commandes/${file.orderId}`} className="mt-1 inline-block text-sm underline">Commande #{file.orderNumber}</Link>:<p className="mt-1 text-xs">Création admin</p>}</div><a href={`/api/admin/keychains/${file.id}`} className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">Télécharger le 3MF</a></article>)}{!files.length&&<p className="text-sm text-ink-soft">Aucun fichier généré pour le moment.</p>}</div></section></div>;
}
