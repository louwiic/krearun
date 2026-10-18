import type {HolderConfiguration} from '@/lib/custom-holder';
export default function HolderConfigurationDetails({configuration:c}:{configuration:HolderConfiguration}){
 const bottomText=c.bottomEngravingText??c.engravingText;
 return <div className="mt-3 space-y-2 text-sm">{(c.topColor||c.bottomColor)&&<div className="flex flex-wrap gap-4">{[['Bague du haut',c.topColor??c.bodyColor],['Bague du bas',c.bottomColor??c.bodyColor]].map(([label,color])=><span key={label} className="inline-flex items-center gap-2"><span aria-hidden className="h-4 w-4 rounded-full border border-black/20" style={{backgroundColor:color}}/>{label} : {color}</span>)}</div>}{c.verticalName&&<p>Prénom vertical gravé : <strong>{c.verticalName}</strong></p>}{c.topEngravingText&&<p>Texte gravé en haut : <strong>{c.topEngravingText}</strong></p>}{bottomText&&<p>Texte gravé en bas : <strong>{bottomText}</strong></p>}</div>;
}
