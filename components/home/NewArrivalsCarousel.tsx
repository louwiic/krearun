"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";

export interface NewArrival {
  id: string;
  slug: string;
  name: string;
  image: string;
  priceCents: number;
  fromPrice: boolean;
  freeShipping: boolean;
}

export default function NewArrivalsCarousel({ items }: { items: NewArrival[] }) {
  const viewport = useRef<HTMLUListElement>(null);
  const id = useId();
  const [edges, setEdges] = useState({ start: true, end: false });

  function updateEdges() {
    const element = viewport.current;
    if (!element) return;
    setEdges({ start: element.scrollLeft <= 2, end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2 });
  }

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(element);
    return () => observer.disconnect();
  }, [items.length]);

  function move(direction: number) {
    const element = viewport.current;
    if (!element) return;
    const card = element.firstElementChild;
    const distance = card ? card.getBoundingClientRect().width + 16 : element.clientWidth;
    element.scrollBy({ left: direction * distance, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  if (!items.length) return null;

  return <section aria-labelledby={`${id}-title`} aria-roledescription="carrousel" className="border-b-2 border-ink bg-cream">
    <div className="mx-auto max-w-6xl px-5 py-5 sm:px-8 sm:py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${id}-title`} className="font-display text-xl font-bold sm:text-2xl">Du nouveau par ici</h2>
        <div className="flex items-center gap-2">
          <Link href="/boutique?nouveautes=1" className="mr-2 text-xs font-bold underline underline-offset-4">Tout voir ↗</Link>
          <button type="button" onClick={() => move(-1)} disabled={edges.start} aria-label="Nouveautés précédentes" aria-controls={id} className="grid h-10 w-10 place-items-center rounded-full border border-ink bg-white text-xl transition-colors hover:bg-sand disabled:cursor-default disabled:opacity-30">←</button>
          <button type="button" onClick={() => move(1)} disabled={edges.end} aria-label="Nouveautés suivantes" aria-controls={id} className="grid h-10 w-10 place-items-center rounded-full border border-ink bg-white text-xl transition-colors hover:bg-sand disabled:cursor-default disabled:opacity-30">→</button>
        </div>
      </div>
      <ul id={id} ref={viewport} onScroll={updateEdges} tabIndex={0} aria-label="Produits nouveaux — faites glisser ou utilisez les flèches" onKeyDown={event => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); }
      }} className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain rounded-xl pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terra">
        {items.map(item => <li key={item.id} className="min-w-0 basis-[88%] shrink-0 snap-start sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)]">
          <Link href={`/boutique/${item.slug}`} data-product-impression={item.id} data-product-click={item.id} className="group flex h-full min-h-32 items-center gap-3 rounded-xl border border-sand bg-white/80 p-3 transition-colors hover:border-terra focus-visible:outline-2 focus-visible:outline-terra">
            {/* eslint-disable-next-line @next/next/no-img-element -- Existing catalog photos and media endpoint. */}
            <img src={item.image} alt="" width={112} height={112} loading="lazy" className="h-24 w-24 shrink-0 rounded-lg bg-white object-contain sm:h-28 sm:w-28" />
            <div className="min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-widest text-terra">Nouveau</span>
              <h3 className="mt-1 line-clamp-2 font-display text-base font-bold leading-tight">{item.name}</h3>
              <p className="mt-2 text-sm font-bold">{item.fromPrice && <span className="font-normal">Dès </span>}{formatPrice(item.priceCents)}</p>
              {item.freeShipping && <p className="mt-0.5 text-[10px] text-ink-soft">Livraison incluse</p>}
              <span className="mt-2 inline-block text-[11px] font-bold underline underline-offset-4 group-hover:text-terra">Découvrir ↗</span>
            </div>
          </Link>
        </li>)}
      </ul>
    </div>
  </section>;
}
