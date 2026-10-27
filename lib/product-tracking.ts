"use client";
import {hasAudienceConsent} from "./privacy";
import {productDay,type ProductEvent} from "./product-events";
const KEY="krearun-product-events-v1";
const ids=new Map<string,string>();
const completed=new Set<string>();
const pending=new Set<string>();
let stored:Record<string,string>={};
let loaded=false;
export function clearProductTracking(){ids.clear();completed.clear();pending.clear();stored={};loaded=false;try{sessionStorage.removeItem(KEY);}catch{}}
export function trackProductEvent(productId:string,kind:ProductEvent["kind"]) {
  if(typeof window==="undefined"||!hasAudienceConsent()||document.visibilityState!=="visible")return;
  // Each product/action/day has one event ID for this tab's browsing session.
  const key=`${productDay()}:${productId}:${kind}`;
  if(!loaded){try{const value=JSON.parse(sessionStorage.getItem(KEY)||"{}");stored=value&&typeof value==="object"&&!Array.isArray(value)?value:{};}catch{stored={};}loaded=true;}
  if(stored[key]==="sent")return;
  let eventId=ids.get(key)||stored[key];
  if(!eventId){eventId=crypto.randomUUID();ids.set(key,eventId);stored[key]=eventId;}
  if(completed.has(eventId)||pending.has(eventId))return;
  const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(stored));}catch{}};
  // Discard previous days instead of keeping browsing history in the tab.
  for(const previous of Object.keys(stored))if(!previous.startsWith(productDay()+":"))delete stored[previous];
  save();pending.add(eventId);
  void(async()=>{
    try{
      for(let attempt=0;attempt<2;attempt++){
        if(!hasAudienceConsent())return;
        try{
          const response=await fetch("/api/product-events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId,productId,kind,consent:true}),keepalive:true});
          if(response.ok){if(hasAudienceConsent()){completed.add(eventId);stored[key]="sent";save();}return;}
          if(response.status<500)return;
        }catch{/* Tracking never interrupts navigation or shopping. */}
      }
    }finally{pending.delete(eventId);}
  })();
}
