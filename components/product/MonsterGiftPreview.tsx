"use client";

import { useId } from "react";
import { MONSTER_GIFT_IMAGE } from "@/lib/monster-gift";

export default function MonsterGiftPreview({ color, colorName }: { color: string; colorName: string }) {
  const filterId = `gift-${useId().replace(/:/g, "")}`;
  const rgb = /^#[\da-f]{6}$/i.test(color) ? [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16) / 255) : [0.93, 0.24, 0.54];
  // Pink backing becomes black; neutral raised claws take the selected color.
  const matrix = rgb.map(channel => `${-.24 * channel / .69} ${.93 * channel / .69} 0 0 0`).join(" ") + " 0 0 0 1 0";
  return <span className="relative block h-24 w-20 shrink-0">
    <svg aria-hidden="true" className="absolute h-0 w-0"><defs><filter id={filterId} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={matrix} /></filter></defs></svg>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={MONSTER_GIFT_IMAGE} alt={`Aperçu du porte-clés griffes offert — ${colorName}`} style={{ filter: `url(#${filterId})` }} className="h-full w-full object-contain" />
  </span>;
}
