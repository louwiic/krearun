"use client";
import BirthMotifImage from "./BirthMotifImage";
import {colorSwatchStyle} from "@/lib/color-swatches";
import type {ProductColor} from "@/lib/types";
import {BIRTH_MOTIFS,type BirthLetterFields} from "@/lib/birth-letter";
export default function BirthLetterPersonalization({value,onChange,colors}:{colors:ProductColor[];value:BirthLetterFields;onChange:(value:BirthLetterFields)=>void}) {
 const customSelected=Boolean(value.customSymbol?.trim());
 const selectedCount=value.motifs.length+(customSelected?1:0);
 const colorHex=(name:string|undefined)=>colors.find(c=>c.name===name)?.hex||'#ffffff';
 function palette(key:'elementBaseColor'|'elementTopColor',title:string) {
  return <fieldset><legend className="text-sm font-bold">{title} — {value[key]}</legend><div className="mt-3 flex flex-wrap gap-2">{colors.map(color=><button key={color.name} type="button" title={color.name} aria-label={`${title} : ${color.name}`} aria-pressed={value[key]===color.name} onClick={()=>onChange({...value,[key]:color.name})} style={colorSwatchStyle(color)} className={`relative h-8 w-8 rounded-full border-2 ${value[key]===color.name?'border-terra ring-2 ring-terra/20':'border-sand'}`}/>)}</div></fieldset>;
 }
 const inputClass="mt-2 w-full rounded-xl border border-sand bg-white px-4 py-3 text-sm";
 function field(key:Exclude<keyof BirthLetterFields,'motifs'>,label:string,type='text',placeholder='',maxLength=32) {
  return <label className="block text-sm font-bold">{label}<input type={type} value={value[key]||""} maxLength={maxLength} onChange={event=>onChange({...value,[key]:event.target.value})} placeholder={placeholder} className={inputClass}/></label>;
 }
 return <fieldset className="space-y-5 rounded-2xl border-2 border-ink bg-linen p-5"><legend className="px-2 text-sm font-bold">Votre lettre de naissance · personnalisation incluse</legend>
  <div className="grid gap-4 sm:grid-cols-2">{field('initial','Lettre souhaitée *','text','Ex. L',1)}{field('name','Prénom *','text','Ex. Lili')}</div>
  <fieldset><legend className="text-sm font-bold">Petits éléments à ajouter * · {selectedCount}/6</legend><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{BIRTH_MOTIFS.map(motif=><label key={motif} className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 bg-white/60 p-3 text-center text-xs font-bold ${value.motifs.includes(motif)?'border-terra':selectedCount>=6?'border-sand opacity-45':'border-sand'}`}><input type="checkbox" aria-label={`Symbole ${motif}`} disabled={!value.motifs.includes(motif)&&selectedCount>=6} checked={value.motifs.includes(motif)} onChange={event=>onChange({...value,motifs:event.target.checked?[...value.motifs,motif]:value.motifs.filter(m=>m!==motif)})} className="absolute left-2 top-2 h-4 w-4 accent-terra"/><BirthMotifImage motif={motif} base={colorHex(value.elementBaseColor)} top={colorHex(value.elementTopColor)}/>{motif}</label>)}</div><p className="mt-2 text-xs font-normal text-ink-soft">6 symboles maximum, informations de naissance comprises. Vignettes illustratives des éléments, sans fond. Cliquez pour sélectionner ou retirer un élément.</p></fieldset>
  <label className="block text-sm font-bold">Votre symbole, s’il n’est pas dans la liste
    <input value={value.customSymbol||""} disabled={selectedCount>=6&&!customSelected} maxLength={60} onChange={event=>onChange({...value,customSymbol:event.target.value})} placeholder="Ex. renard, fleur, petit avion…" className={`${inputClass} disabled:opacity-50`}/>
    <span className="mt-2 block text-xs font-normal text-ink-soft">Un symbole libre compte pour 1 des 6 éléments. {selectedCount>=6&&!customSelected?"Retirez un élément pour ajouter votre symbole.":"Nous vous contactons si votre demande nécessite un ajustement."}</span>
  </label>
  <div className="grid gap-4 sm:grid-cols-2">{value.motifs.includes('Calendrier')&&field('date','Date de naissance *','date')}{value.motifs.includes('Réveil')&&field('time','Heure de naissance *','time')}{value.motifs.includes('Empreintes')&&field('weight','Poids de naissance (g) *','text','Ex. 3090',4)}{value.motifs.includes('Règle')&&field('length','Taille de naissance (cm) *','text','Ex. 49',4)}</div>
  {palette('elementBaseColor','Couleur du fond des éléments')}
  {palette('elementTopColor','Couleur supérieure des éléments et du prénom')}
  {field('note','Autres précisions (facultatif)','text','Ex. prénom sur le bas de la lettre',160)}
  <p className="text-xs leading-relaxed text-ink-soft">Le coloris choisi ci-dessus correspond à la grande lettre. Les photos sont des exemples : nous adaptons la disposition des éléments à votre initiale. Décoration de naissance, sans éclairage.</p>
 </fieldset>;
}
