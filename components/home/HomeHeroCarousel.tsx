"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { MONSTER_SLUG } from "@/lib/monster-preview";
import { BLACK_FRIDAY_CODE as promoCode } from "@/lib/black-friday";

/* eslint-disable @next/next/no-img-element -- The two banners are preoptimized WebP files. */
const slides = ["Black Friday", "Kréarun"];

export default function HomeHeroCarousel({ campaignActive }: { campaignActive: boolean }) {
  const [active, setActive] = useState(0);
  const slideId = useId();
  const promotion = active === 0;

  if (!campaignActive) return (
    <section className="border-b-2 border-ink bg-linen">
      <img src="/brand/krearun-hero.webp" alt="Kréarun — La personnalisation à fond ! Tes idées. Tes couleurs. Ton style." width={2017} height={780} fetchPriority="high" className="block h-auto w-full" />
    </section>
  );

  return (
    <section aria-label="À la une" aria-roledescription="carrousel" className="border-b-2 border-ink bg-linen">
      <div id={slideId} role="group" aria-roledescription="diapositive" aria-label={`${active + 1} sur ${slides.length} · ${slides[active]}`} className="aspect-[4/5] sm:aspect-[2017/780]">
        {promotion ? (
          <Link href={`/boutique/${MONSTER_SLUG}`} aria-label={`Black Friday Griffe, −20 % et un porte-clé prénom offert. Code promo ${promoCode}. Découvrir le porte-boisson`} className="group flex h-full w-full flex-col items-center justify-center bg-[#101010] text-[#fff5df] focus-visible:outline-2 focus-visible:-outline-offset-4 sm:flex-row">
            <div aria-hidden="true" className="hidden w-1/2 flex-col items-start justify-center pl-[7vw] sm:flex">
              <p className="font-display text-[clamp(1.25rem,4.1vw,5rem)] font-extrabold uppercase leading-none">Black Friday</p>
              <p className="mt-2 font-display text-[clamp(2rem,8vw,9rem)] font-extrabold leading-none text-[#ff4164]">−20 %</p>
              <p className="mt-2 font-display text-[clamp(.85rem,2vw,2.3rem)] font-bold">+ 1 porte-clé prénom offert</p>
              <p className="mt-2 rounded border border-[#fff5df]/50 px-3 py-1 text-xs lg:mt-4 lg:text-base">Code promo <strong className="ml-1 tracking-wide">{promoCode}</strong></p>
              <span className="mt-2 rounded-full bg-[#fff5df] px-4 py-2 text-xs font-bold text-[#101010] group-hover:underline lg:mt-4 lg:text-sm">Découvrir le porte-boisson ↗</span>
            </div>
            <img src="/brand/black-friday-monster.webp" alt="" width={1122} height={1402} fetchPriority="high" className="min-h-0 w-full flex-1 object-contain sm:h-full sm:w-1/2 sm:flex-none" />
            <p aria-hidden="true" className="m-2 shrink-0 rounded border border-[#fff5df]/50 px-4 py-1.5 text-sm sm:hidden">Code promo <strong className="ml-1 tracking-wide">{promoCode}</strong></p>
          </Link>
        ) : (
          <img src="/brand/krearun-hero.webp" alt="Kréarun — La personnalisation à fond ! Tes idées. Tes couleurs. Ton style. Porte-boisson et porte-clés personnalisés." width={2017} height={780} className="h-full w-full bg-[#f5f3eb] object-contain" />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-2">
        {slides.map((slide, index) => (
          <button key={slide} type="button" aria-controls={slideId} aria-pressed={index === active} onClick={() => setActive(index)} className="min-h-10 rounded-full border border-ink/20 px-4 text-xs font-bold text-ink transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 aria-pressed:bg-ink aria-pressed:text-white">
            {slide}
          </button>
        ))}
      </div>
    </section>
  );
}
