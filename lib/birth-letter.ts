export const BIRTH_LETTER_SLUG="lettre-de-naissance-personnalisee";
export const BIRTH_MOTIFS=["Ourson","Lapin","Dinosaure","Montgolfière","Papillon","Nuages","Étoiles","Cœurs","Calendrier","Réveil","Empreintes","Règle"] as const;
export interface BirthLetterFields { customSymbol?:string; elementBaseColor?:string; elementTopColor?:string; initial:string; name:string; motifs:string[]; date:string; time:string; weight:string; length:string; colors:string; note:string }
export const EMPTY_BIRTH_LETTER:BirthLetterFields={customSymbol:"",elementBaseColor:"Blanc",elementTopColor:"Bleu Galaxy",initial:"",name:"",motifs:["Ourson","Nuages","Calendrier","Réveil","Empreintes","Règle"],date:"",time:"",weight:"",length:"",colors:"",note:""};
const clean=(value:string,max:number)=>value.trim().replace(/\s+/g," ").replace(/\|/g,"/").slice(0,max);
export function buildBirthLetter(fields:BirthLetterFields):string {
 const initial=fields.initial.trim().toLocaleUpperCase('fr');const name=clean(fields.name,32);
 if(!/^[A-ZÀ-ÖØ-Þ]$/u.test(initial)||!/^\p{L}[\p{L}\p{M} '’\-]{0,31}$/u.test(name))return "";
 const customSymbol=clean(fields.customSymbol||"",60);
 if((!fields.motifs.length&&!customSymbol)||fields.motifs.length+(customSymbol?1:0)>6||new Set(fields.motifs).size!==fields.motifs.length||fields.motifs.some(m=>!BIRTH_MOTIFS.includes(m as typeof BIRTH_MOTIFS[number])))return "";
 const motifs=BIRTH_MOTIFS.filter(m=>fields.motifs.includes(m));
 if(motifs.includes("Calendrier")&&(!/^\d{4}-\d{2}-\d{2}$/.test(fields.date)||Number.isNaN(Date.parse(fields.date))||new Date(fields.date).toISOString().slice(0,10)!==fields.date))return "";
 if(motifs.includes("Réveil")&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(fields.time))return "";
 if(motifs.includes("Empreintes")&&(!/^\d{1,4}$/.test(fields.weight)||Number(fields.weight)<100||Number(fields.weight)>9999))return "";
 if(motifs.includes("Règle")&&(!/^\d{2}(?:[.,]\d)?$/.test(fields.length)||Number(fields.length.replace(',','.'))<20||Number(fields.length.replace(',','.'))>80))return "";
 return [`Lettre naissance : ${initial}`,`Prénom : ${name}`,`Éléments : ${motifs.join(', ')}`,...(customSymbol?[`Symbole libre : ${customSymbol}`]:[]),...(motifs.includes('Calendrier')?[`Date : ${fields.date}`]:[]),...(motifs.includes('Réveil')?[`Heure : ${fields.time}`]:[]),...(motifs.includes('Empreintes')?[`Poids : ${Number(fields.weight)} g`]:[]),...(motifs.includes('Règle')?[`Taille : ${fields.length.replace(',','.')} cm`]:[]),...(clean(fields.elementBaseColor||"",100)?[`Fond des éléments : ${clean(fields.elementBaseColor||"",100)}`]:[]),...(clean(fields.elementTopColor||"",100)?[`Dessus des éléments : ${clean(fields.elementTopColor||"",100)}`]:[]),...(clean(fields.colors,100)?[`Couleurs des détails : ${clean(fields.colors,100)}`]:[]),...(clean(fields.note,160)?[`Précisions : ${clean(fields.note,160)}`]:[])].join(' | ');
}
export function normalizeBirthLetter(value:unknown):string {
 if(typeof value!=="string"||value.length>1000)return "";
 const entries=value.split(' | ').map(part=>{const pos=part.indexOf(' : ');return [part.slice(0,pos),part.slice(pos+3)];});
 const keys=['Lettre naissance','Prénom','Éléments','Date','Heure','Poids','Taille','Couleurs des détails','Précisions','Fond des éléments','Dessus des éléments','Symbole libre'];
 if(entries.some(([key])=>!keys.includes(key))||new Set(entries.map(([key])=>key)).size!==entries.length)return "";
 const v=Object.fromEntries(entries);
 const canonical=buildBirthLetter({customSymbol:v['Symbole libre']||'',elementBaseColor:v['Fond des éléments']||'',elementTopColor:v['Dessus des éléments']||'',initial:v['Lettre naissance']||'',name:v['Prénom']||'',motifs:(v['Éléments']||'').split(', ').filter(Boolean),date:v.Date||'',time:v.Heure||'',weight:(v.Poids||'').replace(/ g$/,''),length:(v.Taille||'').replace(/ cm$/,''),colors:v['Couleurs des détails']||'',note:v['Précisions']||''});
 return canonical===value?canonical:"";
}

export function birthLetterDetailColors(value:string):string[] {
 return value.split(' | ').filter(part=>part.startsWith('Fond des éléments : ')||part.startsWith('Dessus des éléments : ')).map(part=>part.slice(part.indexOf(' : ')+3));
}
