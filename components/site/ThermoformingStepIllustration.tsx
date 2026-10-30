const descriptions = [
  "Le kit posé sur une table : pièces plates, moules, connecteurs et cordon.",
  "La pièce plate est centrée au-dessus du moule, puis descendue dans son logement.",
  "Le sèche-cheveux chauffe progressivement la pièce dans le moule, sans contact.",
  "La partie supérieure du moule descend pour donner son volume à la pièce souple.",
  "La pièce reste dans le moule pendant le refroidissement, représenté par une horloge.",
  "Les deux parties formées sont assemblées et le cordon permet de suspendre la boule.",
];

function Mold({ x = 200, y = 154 }: { x?: number; y?: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <path d="M-74 0v29c0 32 148 32 148 0V0" fill="#b5dce8"/>
    <ellipse rx="74" ry="25" fill="#fff9ef"/>
    <path d="M-56 1c12 40 100 40 112 0" fill="#e9f1f1"/>
    <path d="M-58 20q58 25 116 0" fill="none" opacity=".4"/>
  </g>;
}

function Arrow({ x, y, length = 32 }: { x: number; y: number; length?: number }) {
  return <g transform={`translate(${x} ${y})`} fill="none" stroke="#e56d32"><path d={`M0 0v${length}m-9-9 9 9 9-9`}/></g>;
}

export default function ThermoformingStepIllustration({ step }: { step: number }) {
  const mesh = `thermoforming-mesh-${step}`;
  return <svg role="img" aria-label={descriptions[step]} viewBox="0 0 400 230" className="mb-6 h-auto w-full rounded-xl bg-[#fff8ed]" fill="none" stroke="#241925" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <defs><pattern id={mesh} width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 0l12 12M12 0 0 12" stroke="#e78648" strokeWidth="1.2"/></pattern></defs>
    <path d="M25 211q178-5 350 0" stroke="#d5c8b7" strokeWidth="2"/>
    {step === 0 && <>
      <ellipse cx="89" cy="142" rx="49" ry="28" fill={`url(#${mesh})`}/><ellipse cx="101" cy="130" rx="49" ry="28" fill={`url(#${mesh})`}/>
      <Mold x={278} y={119}/><path d="M220 63q58-32 116 0v15q-58 20-116 0Z" fill="#b5dce8"/>
      <path d="M145 171c-34-29-64 26-34 26 20 0 35-21 52-10" stroke="#e7773f"/>
      <path d="m174 159 12-6 12 6v16l-12 7-12-7Z" fill="#fff9ef"/><circle cx="186" cy="167" r="4" strokeWidth="2"/>
    </>}
    {step === 1 && <>
      <Mold/><ellipse cx="200" cy="58" rx="57" ry="18" fill={`url(#${mesh})`}/><Arrow x={200} y={92} length={30}/>
      <path d="M104 57h25M272 57h25" stroke="#b5dce8" strokeWidth="3"/>
    </>}
    {step === 2 && <>
      <Mold/><ellipse cx="200" cy="152" rx="55" ry="15" fill={`url(#${mesh})`}/>
      <g transform="translate(263 32) rotate(30)"><path d="M-32 0h47q28 0 28 25T15 50h-47Z" fill="#b5dce8"/><path d="M6 50h23l-5 43H8Z" fill="#fff9ef"/><path d="M-32 8h-15v34h15" fill="#fff9ef"/><path d="M16 93c-11 30 30 12 23 40"/><path d="M23 12v24m-8-24v24" strokeWidth="2"/></g>
      <path d="M203 85q-24 9-24 32m6-46q-26 11-30 35m65-5q-8 13-8 26" stroke="#e7773f" strokeWidth="3"/>
    </>}
    {step === 3 && <>
      <Mold/><path d="M144 150q56 52 112 0" fill={`url(#${mesh})`} stroke="#e7773f"/>
      <path d="M142 65q58-29 116 0v17q-58 44-116 0Z" fill="#b5dce8"/>
      <path d="M175 51v-9h50v9"/><Arrow x={112} y={66} length={49}/><Arrow x={288} y={66} length={49}/>
    </>}
    {step === 4 && <>
      <Mold x={155}/><path d="M99 151q56 52 112 0" fill={`url(#${mesh})`} stroke="#e7773f"/>
      <circle cx="298" cy="82" r="39" fill="#fff9ef"/><path d="M298 57v25l17 11" stroke="#e7773f"/><path d="M298 33v-8m-10 0h20"/>
      <path d="M106 65c-17 14 12 20 0 35m38-50c-16 15 11 21 0 36m38-20c-16 14 12 21 0 36" stroke="#87c8df" strokeWidth="3"/>
    </>}
    {step === 5 && <>
      <path d="M203 60c-48-63 48-64 0 0" stroke="#87c8df"/><path d="M190 62h26v18h-26Z" fill="#b5dce8"/>
      <circle cx="203" cy="140" r="62" fill={`url(#${mesh})`}/><ellipse cx="203" cy="140" rx="20" ry="62" stroke="#e7773f" strokeWidth="2"/><path d="M141 140h124" stroke="#e7773f" strokeWidth="2"/>
      <path d="m106 88 4-13 5 13 13 4-13 4-5 13-4-13-13-4Zm192 73 3-10 4 10 10 3-10 4-4 10-3-10-10-4Z" fill="#b5dce8" strokeWidth="2"/>
    </>}
  </svg>;
}
