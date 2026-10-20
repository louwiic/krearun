"use client";
import { useState } from "react";
export default function OrderPhoto({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState("");
  return <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-sand bg-linen">
    {src && failed !== src ? /* eslint-disable-next-line @next/next/no-img-element */
      <img src={src} alt={name} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(src)} className="h-full w-full object-contain" /> :
      <svg role="img" aria-label="Photo non renseignée" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-ink-faint"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 3-3 4 4"/></svg>}
  </span>;
}
