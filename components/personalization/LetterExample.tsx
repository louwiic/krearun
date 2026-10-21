"use client";

import { useEffect, useState } from "react";
import opentype, { type Font } from "opentype.js";
import LetterPreview3D from "@/components/custom-letter/LetterPreview3D";
import { DEFAULT_LETTER } from "@/lib/custom-letter";

export default function LetterExample() {
  const [fonts, setFonts] = useState<[Font, Font] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all(["LibreBaskerville.ttf", "Lobster-Regular.ttf"].map(async (file) => {
      const response = await fetch(`/fonts/${file}`, { signal: controller.signal });
      if (!response.ok) throw new Error("Police indisponible");
      return opentype.parse(await response.arrayBuffer());
    })).then(([initial, name]) => setFonts([initial, name])).catch(() => {
      if (!controller.signal.aborted) setError(true);
    });
    return () => controller.abort();
  }, []);

  return fonts
    ? <LetterPreview3D thumbnail options={DEFAULT_LETTER} fonts={fonts} baseColor="#f67340" nameColor="#171717" view="assembled" />
    : <div role="status" className="flex h-[280px] items-center justify-center p-5 text-center text-sm text-ink-soft">{error ? "L’aperçu est indisponible. Vous pouvez poursuivre la personnalisation." : "Préparation de la lettre en 3D…"}</div>;
}
