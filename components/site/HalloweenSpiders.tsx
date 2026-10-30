import type { CSSProperties } from "react";

const SPIDERS = [
  { left: "8%", size: 25, delay: "0.1s", duration: "5.1s" },
  { left: "28%", size: 20, delay: "0.65s", duration: "6.2s" },
  { left: "57%", size: 29, delay: "0.3s", duration: "5.8s" },
  { left: "88%", size: 23, delay: "1.1s", duration: "4.9s" },
  { left: "43%", size: 22, delay: "1.5s", duration: "5.3s" },
  { left: "75%", size: 26, delay: "0.9s", duration: "5.5s" },
];

/** A short decoration on arrival; no timers, tracking or interaction targets. */
export default function HalloweenSpiders() {
  return <div className="halloween-spiders" aria-hidden="true" data-halloween-spiders>
    {SPIDERS.map((spider, index) => <span key={index} className="halloween-spider" style={{ left: spider.left, width: spider.size, animationDelay: spider.delay, animationDuration: spider.duration } as CSSProperties}>
      <svg viewBox="0 0 48 180" fill="none" focusable="false">
        <path d="M24 0v139" stroke="#786578" strokeWidth="1" />
        <g stroke="#28132e" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m16 146-9-7-4 6m13 6-11-2-3 7m14 0-10 4-2 8m14-8-6 10v6m20-30 9-7 4 6m-13 6 11-2 3 7m-14 0 10 4 2 8m-14-8 6 10v6" />
          <ellipse cx="24" cy="154" rx="11" ry="14" fill="#28132e" />
          <circle cx="24" cy="142" r="6" fill="#28132e" />
        </g>
        <circle cx="21.5" cy="141" r="1.4" fill="#ffbf76" />
        <circle cx="26.5" cy="141" r="1.4" fill="#ffbf76" />
      </svg>
    </span>)}
  </div>;
}
