"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sendPresencePing } from "@/lib/live-presence";

// Ping de présence anonyme (page courante uniquement) pour la boutique en
// temps réel. Soumis au même consentement audience que le reste du tracking :
// sans consentement, journeySessionId() ne renvoie rien et aucun ping ne part.
export default function PresenceTracking() {
  const pathname = usePathname();
  useEffect(() => {
    sendPresencePing();
    const interval = setInterval(sendPresencePing, 15_000);
    const onVisible = () => sendPresencePing();
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [pathname]);
  return null;
}
