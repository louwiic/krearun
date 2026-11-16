/** Decorative ticket: the reward amount and conditions remain available as real text. */
export default function CouponIllustration({ amountCents }: { amountCents: number }) {
  const large = amountCents >= 200;
  const accent = large ? "#b8f13a" : "#ff9367";
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 112 90" className="h-[68px] w-[82px] shrink-0 sm:h-[76px] sm:w-[94px]" fill="none">
    <path d="m13 21 77-8 7 60-77 8z" fill="#16130f" opacity=".09" />
    <g transform={large ? "rotate(7 55 46)" : "rotate(-8 55 46)"}>
      <path d="M14 20h78v14a9 9 0 0 0 0 18v14H14V52a9 9 0 0 0 0-18V20Z" fill={accent} stroke="#16130f" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M73 24v38" stroke="#16130f" strokeWidth="1.6" strokeDasharray="3 4" strokeLinecap="round" opacity=".45" />
      <path d="M22 27h43M22 59h43" stroke="#16130f" strokeWidth="1.3" opacity=".2" />
      <text x="44" y="49" textAnchor="middle" fill="#16130f" fontFamily="Arial, Helvetica, sans-serif" fontSize={large ? "23" : "18"} fontWeight="900">{large ? "2 €" : "0,50 €"}</text>
      <path d="M81 31v8m-4-4h8" stroke="#16130f" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="81" cy="53" r="2" fill="#16130f" />
    </g>
    <path d={large ? "m94 3 2.5 6.5L103 12l-6.5 2.5L94 21l-2.5-6.5L85 12l6.5-2.5L94 3Z" : "m15 3 2.5 6.5L24 12l-6.5 2.5L15 21l-2.5-6.5L6 12l6.5-2.5L15 3Z"} fill={large ? "#ff9367" : "#b8f13a"} stroke="#16130f" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="m97 72 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" fill="#16130f" />
    <circle cx="9" cy="70" r="2.5" fill={accent} />
  </svg>;
}
