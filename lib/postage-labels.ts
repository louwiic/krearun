export type StampCrop = {x:number;y:number;width:number;height:number};
export type PostageSettings = {packageWidthMm:number;packageHeightMm:number;marginMm:number;crop:StampCrop};
export type PostageAddress = {name:string;street:string;extra:string;postalCode:string;city:string;country:string};
export type PostageLabelRecord = {id:string;label:string;sourceName:string;source:string;preview:string;output:string;settings:PostageSettings;address:PostageAddress;printed:boolean;created:string};
export const DEFAULT_POSTAGE_SETTINGS={packageWidthMm:230,packageHeightMm:160,marginMm:50};
export const EMPTY_POSTAGE_ADDRESS:PostageAddress={name:'',street:'',extra:'',postalCode:'',city:'',country:'LA REUNION'};
export const mm=(value:number)=>value*72/25.4;
export function parsePostageAddress(value:unknown):PostageAddress{
 const v=(value&&typeof value==='object'?value:{}) as Record<string,unknown>;const result={...EMPTY_POSTAGE_ADDRESS};
 for(const key of Object.keys(result) as (keyof PostageAddress)[]){const input=v[key];if(input!==undefined&&typeof input!=='string')throw Error('Adresse invalide.');result[key]=String(input||'').normalize('NFC').trim().replace(/\s+/g,' ');if(result[key].length>160)throw Error('Une ligne d’adresse est trop longue.');}
 if(!result.name||!result.street||!result.postalCode||!result.city)throw Error('Complète le nom, la voie, le code postal et la ville.');return result;
}
export function parsePostageSettings(value:unknown):PostageSettings{
 if(!value||typeof value!=='object')throw Error('Format invalide.');const v=value as PostageSettings;
 for(const [key,min,max] of [['packageWidthMm',100,1000],['packageHeightMm',80,1000],['marginMm',0,100]] as const)if(typeof v[key]!=='number'||!Number.isFinite(v[key])||v[key]<min||v[key]>max)throw Error('Vérifie les dimensions du paquet et les marges.');
 if(!v.crop||['x','y','width','height'].some(k=>typeof v.crop[k as keyof StampCrop]!=='number'||!Number.isFinite(v.crop[k as keyof StampCrop])))throw Error('Recadrage invalide.');
 if(v.crop.x<0||v.crop.y<0||v.crop.width<=0||v.crop.height<=0)throw Error('Recadrage invalide.');
 return {packageWidthMm:v.packageWidthMm,packageHeightMm:v.packageHeightMm,marginMm:v.marginMm,crop:{...v.crop}};
}
export function postageGeometry(value:PostageSettings){
 const s=parsePostageSettings(value),padding=2,gap=5;
 const availableWidth=s.packageWidthMm-2*s.marginMm,availableHeight=s.packageHeightMm-2*s.marginMm;
 const stampWidth=s.crop.width+padding*2,stampHeight=s.crop.height+padding*2;
 const addressWidth=Math.min(110,availableWidth-stampWidth-gap,190-stampWidth-gap),addressHeight=Math.min(60,availableHeight);
 if(addressWidth<40||addressHeight<30||stampHeight>availableHeight||stampWidth+gap+addressWidth>190)throw Error('Les deux étiquettes ne tiennent pas dans la zone disponible. Vérifie le recadrage du timbre, augmente la taille du paquet ou réduis les marges. Le timbre ne sera pas réduit.');
 return {availableWidth,availableHeight,stampWidth,stampHeight,addressWidth,addressHeight,padding,gap,width:addressWidth+gap+stampWidth,height:Math.max(addressHeight,stampHeight)};
}
