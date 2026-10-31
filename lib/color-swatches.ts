import type { CSSProperties } from "react";
import type { ProductColor } from "./types";

/** Keep material swatches distinct from product photography (`image`). */
export function colorSwatchStyle(color: Pick<ProductColor,"hex"|"swatchImage">): CSSProperties {
  const fallback: CSSProperties = { backgroundColor: color.hex };
  if (!color.swatchImage) return fallback;
  let url: string;
  try {
    if (/^\/api\/r2\/(site|products)\//.test(color.swatchImage)) url = new URL(color.swatchImage,"https://krearun.re").pathname;
    else { const parsed = new URL(color.swatchImage); if (parsed.protocol !== "https:") return fallback; url = parsed.href; }
  } catch { return fallback; }
  // Display an enlarged crop of the supplied material reference. The original
  // image stays intact, while product lettering/background stays outside the dot.
  return { ...fallback, backgroundImage: `url(${JSON.stringify(url)})`, backgroundSize: "260% auto", backgroundPosition: "50% 65%", backgroundRepeat: "no-repeat" };
}
