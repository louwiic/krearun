/* eslint-disable @next/next/no-img-element -- Original artwork extracted from the supplied brand guide. */
export default function BrandLogo({ signature = false, className = "" }: { signature?: boolean; className?: string }) {
  return <img src={signature ? "/brand/krearun-signature.webp" : "/brand/krearun-wordmark.webp"} alt={signature ? "Kréarun — La personnalisation à fond !" : "Kréarun"} width={1605} height={signature ? 465 : 340} className={`h-auto ${className}`} />;
}
