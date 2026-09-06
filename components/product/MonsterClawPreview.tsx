interface MonsterClawPreviewProps {
  color: string;
  colorName: string;
}

export default function MonsterClawPreview({
  color,
  colorName,
}: MonsterClawPreviewProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-ink bg-[#111312] px-4 py-3 shadow-soft">
      <div
        aria-hidden
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at 72% 20%, ${color}, transparent 48%)`,
        }}
      />
      <div className="relative flex items-center justify-between gap-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cream/55">
            Aperçu des griffes
          </p>
          <p className="mt-1 text-sm font-bold text-cream">{colorName}</p>
        </div>
        <svg
          viewBox="300 0 1680 1860"
          role="img"
          aria-label={`Griffes Monster en coloris ${colorName}`}
          className="h-20 w-24 shrink-0 drop-shadow-[0_4px_8px_rgba(0,0,0,0.45)] sm:h-20 sm:w-24"
        >
          <defs>
            <mask
              id="monster-claws-mask"
              x="0"
              y="0"
              width="2281.188"
              height="2496"
              maskUnits="userSpaceOnUse"
              style={{ maskType: "luminance" }}
            >
              <rect x="0" y="0" width="2281.188" height="2496" fill="white" />
              <image
                href="/products/monster-energy-logo-black-and-white.svg"
                x="0"
                y="0"
                width="2281.188"
                height="2496"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="2281.188"
            height="2496"
            fill={color}
            mask="url(#monster-claws-mask)"
            className="transition-[fill] duration-300 ease-out"
          />
        </svg>
      </div>
    </div>
  );
}
