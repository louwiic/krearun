"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/CartContext";
import { hasAudienceConsent } from "@/lib/privacy";
import { clearJourneyTracking, trackJourney } from "@/lib/journey-tracking";
import { journeyPage, type JourneyItem } from "@/lib/purchase-journey";

export default function PurchaseTracking() {
  const pathname = usePathname();
  const { items, isOpen, hydrated } = useCart();
  const current = useRef<JourneyItem[]>([]);
  const previous = useRef<string | null>(null);
  const visited = useRef("");
  useEffect(() => {
    current.current = items;
    if (!hydrated) return;
    const json = JSON.stringify(items.map(i => ({ productId: i.productId, quantity: i.quantity, variantId: i.variantId })));
    if (previous.current !== null && previous.current !== json) {
      const before = JSON.parse(previous.current) as JourneyItem[];
      const count = (xs: JourneyItem[], id: string) => xs.filter(i => i.productId === id).reduce((s,i) => s+i.quantity,0);
      const added = items.find(i => count(items,i.productId) > count(before,i.productId));
      trackJourney(added ? "add_to_cart" : "cart_updated", items, added?.productId);
    }
    previous.current = json;
  }, [items, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    function visit() {
      if (!hasAudienceConsent()) { clearJourneyTracking(); visited.current = ""; return; }
      if (document.visibilityState !== "visible") return;
      if (visited.current === pathname) return;
      visited.current = pathname;
      trackJourney("visit", current.current, undefined, journeyPage(pathname));
      if (pathname === "/panier") trackJourney("view_cart", current.current);
    }
    visit();
    window.addEventListener("krearun:privacy-change", visit); window.addEventListener("storage", visit); document.addEventListener("visibilitychange", visit);
    return () => { window.removeEventListener("krearun:privacy-change", visit); window.removeEventListener("storage", visit); document.removeEventListener("visibilitychange", visit); };
  }, [pathname, hydrated]);
  useEffect(() => { if (hydrated && isOpen) trackJourney("view_cart", items); }, [isOpen, hydrated, items]);
  return null;
}
