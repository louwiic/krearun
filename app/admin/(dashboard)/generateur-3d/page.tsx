import NameplateGenerator from "@/components/admin/NameplateGenerator";

export default function Generateur3DPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-3xl font-semibold">Générateur de prénoms 3D</h1>
      <p className="mb-8 mt-1 max-w-3xl text-sm text-ink-soft">
        Créez rapidement un prénom avec un fond plat qui suit la forme des lettres, puis exportez-le en STL pour Bambu Studio.
      </p>
      <NameplateGenerator />
    </div>
  );
}
