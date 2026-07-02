"use client";

import { useState } from "react";

export default function Gallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const list = images.length > 0 ? images : ["/products/hero.svg"];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-blob bg-cream shadow-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={list[active]}
          alt={name}
          className="aspect-square w-full object-cover"
        />
      </div>
      {list.length > 1 && (
        <div className="flex gap-3">
          {list.map((img, i) => (
            <button
              key={img}
              onClick={() => setActive(i)}
              aria-label={`Photo ${i + 1}`}
              className={`overflow-hidden rounded-2xl border-2 transition-all ${
                active === i ? "border-terra" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="h-20 w-20 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
