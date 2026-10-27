export const PRODUCT_EVENT_KINDS = ["impression", "click", "view"] as const;
export type ProductEvent = { eventId:string; productId:string; kind:typeof PRODUCT_EVENT_KINDS[number] };
export type ProductDailyStats = {productId:string;day:string;impressions:number;clicks:number;views:number};
export type ProductCounts = {impressions:number;clicks:number;views:number};
export function parseProductEvent(value:unknown):ProductEvent|null {
  if(!value||typeof value!=="object")return null;
  const {eventId,productId,kind,consent} = value as Record<string,unknown>;
  if(consent!==true||typeof eventId!=="string"||! /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId))return null;
  if(typeof productId!=="string"||!/^([a-z0-9]{15}|clicker-studio)$/.test(productId)||!PRODUCT_EVENT_KINDS.includes(kind as ProductEvent["kind"]))return null;
  return {eventId,productId,kind:kind as ProductEvent["kind"]};
}
export function productDay(date=new Date()):string{return new Date(date.getTime()+4*3600000).toISOString().slice(0,10);}
export function shiftProductDay(day:string,offset:number):string{return new Date(Date.parse(day+"T00:00:00Z")+offset*86400000).toISOString().slice(0,10);}
export function productCounts(rows:ProductDailyStats[],start="",end="",productId="") {
  const byProduct:Record<string,ProductCounts>={};
  const byDay:Record<string,ProductCounts>={};
  const total:ProductCounts={impressions:0,clicks:0,views:0};
  for(const row of rows){
    if((start&&row.day<start)||(end&&row.day>end)||(productId&&row.productId!==productId))continue;
    const product=byProduct[row.productId]??={impressions:0,clicks:0,views:0};
    const day=byDay[row.day]??={impressions:0,clicks:0,views:0};
    for(const key of ["impressions","clicks","views"] as const){const value=Math.max(0,Number(row[key])||0);total[key]+=value;product[key]+=value;day[key]+=value;}
  }
  return {total,byProduct,byDay};
}
