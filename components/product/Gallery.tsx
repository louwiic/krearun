"use client";

import { useState } from "react";

export default function Gallery({
  images,
  videoUrl = "",
  name,
}: {
  images: string[];
  videoUrl?: string;
  name: string;
}) {
  const [active, setActive] = useState(0);
  const media = [
    ...(images.length > 0 ? images : ["/products/hero.svg"]).map((src) => ({
      type: "image" as const,
      src,
    })),
    ...(videoUrl ? [{ type: "video" as const, src: videoUrl }] : []),
  ];
  const activeMedia = media[active] ?? media[0];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-blob bg-cream shadow-soft">
        {activeMedia.type === "video" ? (
          <video
            src={activeMedia.src}
            className="aspect-square w-full object-cover"
            controls
            muted
            playsInline
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={activeMedia.src}
            alt={name}
            className="aspect-square w-full object-cover"
          />
        )}
      </div>
      {media.length > 1 && (
        <div className="flex gap-3">
          {media.map((item, i) => (
            <button
              key={item.src}
              onClick={() => setActive(i)}
              aria-label={item.type === "video" ? "Vidéo produit" : `Photo ${i + 1}`}
              className={`relative overflow-hidden rounded-2xl border-2 transition-all ${
                active === i ? "border-terra" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {item.type === "video" ? (
                <>
                  <video src={item.src} muted playsInline className="h-20 w-20 object-cover" />
                  <span className="absolute inset-0 grid place-items-center bg-ink/25 text-xs font-bold text-cream">
                    ▶
                  </span>
                </>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={item.src} alt="" className="h-20 w-20 object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
