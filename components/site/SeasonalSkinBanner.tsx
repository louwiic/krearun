export default function SeasonalSkinBanner() {
  return <aside className="seasonal-skin-banner" aria-label="Ambiance Halloween">
    <div className="mx-auto flex max-w-6xl items-center justify-center gap-4 px-5 py-4 sm:gap-6">
      <svg className="h-14 w-14 shrink-0 sm:h-16 sm:w-16" viewBox="0 0 80 80" fill="none" aria-hidden="true">
        <path d="M41 23c-4-9 0-14 8-16l4 8c-7 0-8 4-8 8" fill="#adbc83" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M40 25C15 12 4 37 12 57c5 13 16 17 28 12 12 5 25 0 29-13 7-22-7-42-29-31Z" fill="#ff9b46" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M33 26c-12 10-12 33-3 42m17-42c12 11 12 32 3 42" stroke="#b24d24" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="m23 43 9-8 3 11-12-3Zm23 3 3-11 9 8-12 3ZM25 54l10 3 5-5 5 5 10-3c-6 13-24 13-30 0Z" fill="#28132e" stroke="#28132e" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
      <div><p className="text-xs font-bold uppercase tracking-[0.16em]">Halloween à l’atelier</p><p className="mt-1 font-display text-lg sm:text-2xl">Un peu de frisson. Beaucoup de création.</p></div>
      <svg className="hidden h-12 w-12 shrink-0 sm:block" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M12 52V28a20 20 0 0 1 40 0v24l-10-7-10 7-10-7-10 7Z" fill="#fff7ec" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/><path d="M25 26v5m14-5v5" stroke="#28132e" strokeWidth="4" strokeLinecap="round"/><path d="M29 38q3 5 6 0" stroke="#28132e" strokeWidth="2.5" strokeLinecap="round"/></svg>
    </div>
  </aside>;
}
