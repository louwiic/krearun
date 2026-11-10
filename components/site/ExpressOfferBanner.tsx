"use client";

import Link from "next/link";
import { useState } from "react";

interface Props {
  enabled: boolean;
  title: string;
  description: string;
  image: string;
  cta: string;
  href: string;
}

function safeUrl(value: string) {
  const url = value.trim();
  if (url.startsWith("/") && !url.startsWith("//") && !/[\\\s]/.test(url)) return url;
  try { return new URL(url).protocol === "https:" ? url : ""; } catch { return ""; }
}

export default function ExpressOfferBanner({ enabled, title, description, image, cta, href }: Props) {
  const [dismissed, setDismissed] = useState("");
  const signature = JSON.stringify([title, description, image, cta, href]);
  if (!enabled || !title.trim() || dismissed === signature) return null;
  const link = safeUrl(href);
  const photo = safeUrl(image);
  return <aside aria-label="Offre express" className="border-b-2 border-ink bg-cream">
    <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-5 py-5 pr-12 sm:flex-nowrap sm:gap-6 sm:px-8 sm:pr-14">
      {/* eslint-disable-next-line @next/next/no-img-element -- Admin photo uploaded through the existing WebP media pipeline. */}
      {photo && <img src={photo} alt="" width={96} height={96} className="h-20 w-20 shrink-0 rounded-xl bg-white object-contain sm:h-24 sm:w-24" />}
      <div className="min-w-0 flex-1 basis-40">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-terra">Offre express</p>
        <h2 className="mt-1 break-words font-display text-lg font-bold sm:text-xl">{title}</h2>
        {description && <p className="mt-1 whitespace-pre-line break-words text-xs leading-relaxed text-ink-soft sm:text-sm">{description}</p>}
      </div>
      {link && cta.trim() && <Link href={link} className="w-full shrink-0 rounded-full bg-terra px-6 py-3 text-center text-sm font-bold text-cream transition-colors hover:bg-terra-deep sm:w-auto">{cta}</Link>}
      <button type="button" onClick={() => setDismissed(signature)} aria-label="Fermer l’offre express" className="absolute right-1 top-1 grid h-10 w-10 place-items-center rounded-full text-xl text-ink-soft hover:bg-sand focus-visible:outline-2 focus-visible:outline-terra">×</button>
    </div>
  </aside>;
}
