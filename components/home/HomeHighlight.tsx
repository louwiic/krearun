/* eslint-disable @next/next/no-img-element -- Catalog images are served by the existing media endpoint. */
import Link from "next/link";
import {type HomeHighlight as HighlightConfig,resolveHomeHighlight} from "@/lib/home-highlight";
import {formatPrice} from "@/lib/format";
import {hasFreeShipping} from "@/lib/free-shipping";
import {publicProductCopy} from "@/lib/public-copy";
import type {Product} from "@/lib/types";
export default function HomeHighlight({config,products}:{config:HighlightConfig;products:Product[]}) {
 const content=resolveHomeHighlight(config,products);if(!content)return null;
 const {product,image,video}=content;const href=`/boutique/${product.slug}`;
 const prices=product.variants.filter(v=>v.active).map(v=>v.priceCents||product.priceCents);const price=prices.length?Math.min(...prices):product.priceCents;
 return <section id="a-ne-pas-rater" className="editorial-section" aria-labelledby="home-highlight-title">
  <div className="grid items-center gap-8 rounded-2xl border border-sand bg-cream p-5 sm:p-8 md:grid-cols-2 md:gap-10">
   <div className="min-w-0">
    <p className="editorial-eyebrow">{config.heading||"À ne pas rater"}</p>
    <h2 id="home-highlight-title" className="mt-3 font-display text-3xl font-bold sm:text-4xl">{product.name}</h2>
    <p className="mt-5 whitespace-pre-line leading-relaxed text-ink-soft">{config.description||publicProductCopy(product.tagline)}</p>
    {image&&video&&<Link href={href} className="mt-5 inline-block rounded-xl border border-sand bg-linen p-2"><img src={image} alt={product.name} width={140} height={140} loading="lazy" className="h-28 w-28 rounded-lg object-contain"/></Link>}
    <p className="mt-5 font-display text-2xl font-bold">{prices.length>1&&"Dès "}{formatPrice(price)}</p>
    {hasFreeShipping(product.slug)&&<p className="mt-1 text-sm font-semibold text-terra">Livraison incluse</p>}
    <Link href={href} data-product-click={product.id} className="mt-6 inline-flex rounded-full bg-terra px-6 py-3 font-bold text-white hover:bg-terra-deep">{config.cta||"Je découvre"} →</Link>
   </div>
   {(video||image)&&<div className="min-w-0 overflow-hidden rounded-2xl border border-sand bg-linen">
    {video?<video src={video} autoPlay loop muted playsInline preload="auto" aria-label={`Démonstration : ${product.name}`} className="max-h-[520px] w-full object-contain"/>:<img src={image} alt={product.name} width={700} height={700} loading="lazy" className="aspect-square max-h-[520px] w-full object-contain"/>}
   </div>}
  </div>
 </section>;
}
