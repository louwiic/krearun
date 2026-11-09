"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartContext";

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
  const pathname = usePathname();
  const { isOpen } = useCart();
  const [dismissed, setDismissed] = useState("");
  const [height, setHeight] = useState(0);
  const banner = useRef<HTMLElement>(null);
  const signature = JSON.stringify([title, description, image, cta, href]);
  const visible = enabled && Boolean(title.trim()) && dismissed !== signature && !isOpen &&
    !/^\/(?:panier|commande|connexion|compte|inscription|mot-de-passe|reset-password)(?:\/|$)/.test(pathname);

  useEffect(() => {
    if (!visible || !banner.current) return;
    const observer = new ResizeObserver(entries => setHeight(Math.ceil(entries[0].contentRect.height)));
    observer.observe(banner.current);
    return () => observer.disconnect();
  }, [visible]);

  if (!visible) return null;
  const link = safeUrl(href);
  const photo = safeUrl(image);
  return <>
    <div aria-hidden="true" style={{ height: height + 32 }} />
    <aside ref={banner} aria-label="Offre express" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-cream shadow-[0_-6px_30px_rgba(0,0,0,0.10)]">
      <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 pr-12 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-nowrap sm:gap-5 sm:px-6 sm:pr-14">
        {/* eslint-disable-next-line @next/next/no-img-element -- Admin photo uploaded through the existing WebP media pipeline. */}
        {photo && <img src={photo} alt="" width={64} height={64} className="h-14 w-14 shrink-0 rounded-xl object-cover sm:h-16 sm:w-16" />}
        <div className="min-w-0 flex-1 basis-40">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-terra">Offre express</p>
          <p className="mt-1 break-words text-sm font-bold sm:text-base">{title}</p>
          {description && <p className="mt-1 whitespace-pre-line break-words text-xs leading-relaxed text-ink-soft sm:text-sm">{description}</p>}
        </div>
        {link && cta.trim() && <Link href={link} className="w-full shrink-0 rounded-full bg-terra px-5 py-3 text-center text-sm font-bold text-cream transition-colors hover:bg-terra-deep sm:w-auto">{cta}</Link>}
        <button type="button" onClick={() => setDismissed(signature)} aria-label="Fermer l’offre express" className="absolute right-1 top-1 grid h-10 w-10 place-items-center rounded-full text-xl text-ink-soft hover:bg-sand focus-visible:outline-2 focus-visible:outline-terra">×</button>
      </div>
    </aside>
  </>;
}
