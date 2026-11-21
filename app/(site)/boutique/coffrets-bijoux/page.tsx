import type { Metadata } from "next";
import CoffretConfigurator from "@/components/coffrets/CoffretConfigurator";
export const metadata: Metadata = {title:"Coffrets à bijoux tropicaux",description:"Composez votre coffret à bijoux Kréarun : huit motifs péi, deux formats et deux supports à bijoux.",alternates:{canonical:"/boutique/coffrets-bijoux"}};
export default function CoffretsPage() { return <CoffretConfigurator/>; }
