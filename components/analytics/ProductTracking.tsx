"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";
import {hasAudienceConsent} from "@/lib/privacy";
import {clearProductTracking,trackProductEvent} from "@/lib/product-tracking";

export default function ProductTracking(){
  const pathname=usePathname();
  useEffect(()=>{
    let observer:IntersectionObserver|undefined;
    const timers=new Map<Element,ReturnType<typeof setTimeout>>();
    const watched=new Set<Element>();
    const cancel=()=>{timers.forEach(clearTimeout);timers.clear();};
    function observe(){
      if(!observer||!hasAudienceConsent()||document.visibilityState!=="visible")return;
      document.querySelectorAll("[data-product-impression],[data-product-view]").forEach(element=>{if(!watched.has(element)){watched.add(element);observer!.observe(element);}});
    }
    function configure(){
      observer?.disconnect();observer=undefined;cancel();watched.clear();
      if(!hasAudienceConsent()){clearProductTracking();return;}
      if(document.visibilityState!=="visible"||!("IntersectionObserver" in window))return;
      observer=new IntersectionObserver(entries=>{
        for(const entry of entries){
          if(!entry.isIntersecting||entry.intersectionRatio<.5){const timer=timers.get(entry.target);if(timer)clearTimeout(timer);timers.delete(entry.target);continue;}
          if(timers.has(entry.target))continue;
          timers.set(entry.target,setTimeout(()=>{
            timers.delete(entry.target);
            if(!entry.target.isConnected)return;
            const kind=entry.target.hasAttribute("data-product-view")?"view":"impression";
            const id=entry.target.getAttribute(kind==="view"?"data-product-view":"data-product-impression");
            if(id)trackProductEvent(id,kind);
            observer?.unobserve(entry.target);
          },1000));
        }
      },{threshold:.5});observe();
    }
    function click(event:MouseEvent){
      if(event.button!==0||!hasAudienceConsent())return;
      const anchor=(event.target instanceof Element?event.target.closest("a[data-product-click]"):null);
      const id=anchor?.getAttribute("data-product-click");
      if(id){trackProductEvent(id,"impression");trackProductEvent(id,"click");}
    }
    configure();
    const mutations=new MutationObserver(observe);mutations.observe(document.body,{childList:true,subtree:true});
    window.addEventListener("krearun:privacy-change",configure);window.addEventListener("storage",configure);
    document.addEventListener("visibilitychange",configure);document.addEventListener("click",click,true);
    return()=>{observer?.disconnect();mutations.disconnect();cancel();window.removeEventListener("krearun:privacy-change",configure);window.removeEventListener("storage",configure);document.removeEventListener("visibilitychange",configure);document.removeEventListener("click",click,true);};
  },[pathname]);
  return null;
}
