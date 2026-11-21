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

  return <section aria-labelledby={`${id}-title`} aria-roledescription="carrousel" className="mx-auto my-6 max-w-[1540px] bg-[#f36b26] text-white sm:my-8">
    <div className="px-5 py-7 sm:px-7 sm:py-9">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${id}-title`} className="font-display text-2xl font-bold sm:text-3xl">Les nouveautés de l’atelier</h2>
        <div className="flex items-center gap-2">
          <Link href="/boutique?nouveautes=1" className="mr-2 text-xs font-bold underline underline-offset-4">Tout voir ↗</Link>
          <button type="button" onClick={() => move(-1)} disabled={edges.start} aria-label="Nouveautés précédentes" aria-controls={id} className="grid h-10 w-10 place-items-center rounded-full border border-ink bg-white text-xl text-ink transition-colors hover:bg-sand disabled:cursor-default disabled:opacity-30">←</button>
          <button type="button" onClick={() => move(1)} disabled={edges.end} aria-label="Nouveautés suivantes" aria-controls={id} className="grid h-10 w-10 place-items-center rounded-full border border-ink bg-white text-xl text-ink transition-colors hover:bg-sand disabled:cursor-default disabled:opacity-30">→</button>
        </div>
      </div>
      <ul id={id} ref={viewport} onScroll={updateEdges} tabIndex={0} aria-label="Produits nouveaux — faites glisser ou utilisez les flèches" onKeyDown={event => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); }
      }} className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain rounded-xl pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terra">
        {items.map(item => <li key={item.id} className="min-w-0 basis-[72%] shrink-0 snap-start sm:basis-[calc((100%-2rem)/3)] lg:basis-[calc((100%-3rem)/4)]">
          <Link href={`/boutique/${item.slug}`} data-product-impression={item.id} data-product-click={item.id} className="group flex h-full flex-col overflow-hidden rounded-xl bg-white text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            {/* eslint-disable-next-line @next/next/no-img-element -- Existing catalog photos and media endpoint. */}
            <img src={item.image} alt="" width={600} height={600} loading="lazy" className="aspect-square w-full bg-[#f5f5f5] object-contain" />
            <div className="flex min-w-0 flex-1 flex-col items-start p-4">
              <span className="text-[9px] font-bold uppercase tracking-widest text-terra">Nouveau</span>
              <h3 className="mt-1 line-clamp-2 min-h-[2.5em] font-display text-base font-bold leading-tight sm:text-lg">{item.name}</h3>
              <p className="mt-2 text-sm font-bold">{item.fromPrice && <span className="font-normal">Dès </span>}{formatPrice(item.priceCents)}</p>
              {item.freeShipping && <p className="mt-0.5 text-[10px] text-ink-soft">Livraison incluse</p>}
              <span className="mt-auto inline-block pt-3 text-xs font-bold underline underline-offset-4 group-hover:text-terra">Découvrir ↗</span>
            </div>
          </Link>
        </li>)}
      </ul>
    </div>
  </section>;
}
