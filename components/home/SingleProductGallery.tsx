"use client";

import { useEffect, useState } from "react";

export default function SingleProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0] ?? "/products/hero.svg";

  useEffect(() => {
    const selectVariantImage = (event: Event) => {
      const image = (event as CustomEvent<{ image?: string }>).detail?.image;
      const index = image ? images.indexOf(image) : -1;
      if (index >= 0) setActiveIndex(index);
    };
    window.addEventListener("krearun:select-product-image", selectVariantImage);
    return () => window.removeEventListener("krearun:select-product-image", selectVariantImage);
  }, [images]);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden border-2 border-ink bg-ink shadow-hard">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage}
          alt={`${name} — vue ${activeIndex + 1}`}
          className="aspect-[3/4] w-full object-cover sm:aspect-[4/5] lg:max-h-[570px]"
        />
        {name.toLowerCase().includes("monster") ? (
          <div className="absolute bottom-3 right-3 aspect-square w-20 overflow-hidden border-2 border-ink bg-cream shadow-hard-terra sm:bottom-4 sm:right-4 sm:w-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/api/r2/products/monster/accessoires-monster-assortis.png"
              alt="Accessoires Monster offerts"
              className="h-full w-full object-cover"
            />
            <p className="absolute inset-x-0 bottom-0 border-t-2 border-ink bg-cream px-1 py-1 text-center text-[8px] font-bold uppercase leading-tight text-ink sm:text-[9px]">
              Accessoires offerts
            </p>
          </div>
        ) : null}
        <span className="absolute right-3 top-3 border-2 border-ink bg-cream px-3 py-1.5 text-[10px] font-bold uppercase text-ink shadow-hard sm:right-4 sm:top-4 sm:text-xs">
          Photo {activeIndex + 1}/{images.length}
        </span>
      </div>

      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-2.5">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Afficher la photo ${index + 1} de ${name}`}
              aria-pressed={activeIndex === index}
              className={`overflow-hidden border-2 bg-ink transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra ${
                activeIndex === index
                  ? "border-[#00c8b8] opacity-100"
                  : "border-ink opacity-65 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt=""
                className="aspect-square w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
