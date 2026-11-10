import Link from "next/link";
import NameplateGenerator from "@/components/admin/NameplateGenerator";

export default function Generateur3DPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-3xl font-semibold">Générateur de prénoms 3D</h1>
      <p className="mb-8 mt-1 max-w-3xl text-sm text-ink-soft">
        Créez rapidement un prénom avec un fond plat qui suit la forme des lettres, puis exportez-le en STL pour Bambu Studio.
      </p>
      <Link href="/admin/porte-cles" className="mb-6 inline-block rounded-full bg-terra px-6 py-3 text-sm font-bold text-white">Générateur de porte-clés avec anneau →</Link>
      <NameplateGenerator />
    </div>
  );
}
