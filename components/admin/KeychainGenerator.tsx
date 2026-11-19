"use client";

import { useState } from "react";
import type { ColorAvailability } from "@/lib/color-availability";
import KeychainConfigurator from "@/components/keychains/KeychainConfigurator";
import ElementKeychainGenerator from "./ElementKeychainGenerator";

export default function KeychainGenerator({ inventory }: { inventory: ColorAvailability[] }) {
  const [mode, setMode] = useState<"name" | "symbols">("name");

  return <div>
    <fieldset className="mb-8">
      <legend className="mb-3 text-sm font-bold">Que souhaitez-vous générer ?</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {([
          ["name", "Prénom", "Un prénom avec sa police, son fond et ses couleurs."],
          ["symbols", "Symboles", "Des motifs, lettres ou chiffres à assembler en porte-clés."],
        ] as const).map(([value, title, description]) => <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 ${mode === value ? "border-terra bg-cream" : "border-sand bg-white"}`}>
          <input type="radio" name="keychain-generator-kind" value={value} checked={mode === value} onChange={() => setMode(value)} className="mt-1 accent-terra" />
          <span><span className="block font-bold">{title}</span><span className="mt-1 block text-sm text-ink-soft">{description}</span></span>
        </label>)}
      </div>
    </fieldset>
    <section hidden={mode !== "name"} aria-label="Générateur de porte-clés prénom">
      <KeychainConfigurator inventory={inventory} admin />
    </section>
    <div hidden={mode !== "symbols"}>
      <ElementKeychainGenerator inventory={inventory} />
    </div>
  </div>;
}
