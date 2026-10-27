import Link from "next/link";
import ProductAudience from "@/components/admin/ProductAudience";
import {getProductDailyStats,getProducts} from "@/lib/store";
import {productDay} from "@/lib/product-events";
import {CLICKER_PRODUCT} from "@/lib/clicker";
export const dynamic="force-dynamic";
export default async function Page({searchParams}:{searchParams:Promise<{produit?:string}>}){
 const [rows,products,query]=await Promise.all([getProductDailyStats(),getProducts({includeInactive:true}),searchParams]);
 const choices=[...products.map(({id,name})=>({id,name})),{id:CLICKER_PRODUCT.id,name:CLICKER_PRODUCT.name}];
 return <div className="mx-auto max-w-6xl"><Link href="/admin/produits" className="text-sm font-semibold text-ink-soft">← Retour aux produits</Link><h1 className="mt-4 font-display text-3xl font-semibold">Statistiques des produits</h1><p className="mb-8 mt-2 text-sm text-ink-soft">Suivez la visibilité des produits et les visites de leurs fiches.</p><ProductAudience rows={rows} products={choices} today={productDay()} initialProduct={choices.some(p=>p.id===query.produit)?query.produit:""}/></div>;
}
