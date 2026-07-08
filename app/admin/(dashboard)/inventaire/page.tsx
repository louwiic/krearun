import { saveInventoryColorAction } from "@/app/admin/actions";
import { getInventoryColors } from "@/lib/store";

export const dynamic = "force-dynamic";

const field =
  "w-full rounded-2xl border border-sand bg-linen px-4 py-3 text-sm outline-none focus:border-terra";
const label = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-soft";

function formatKg(grams: number) {
  return `${(grams / 1000).toLocaleString("fr-FR", {
    minimumFractionDigits: grams % 1000 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} kg`;
}

export default async function InventairePage() {
  const colors = await getInventoryColors({ includeInactive: true });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-sage-deep">
          Matière d&apos;impression
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Inventaire couleur</h1>
      </div>

      <section className="mb-8 rounded-blob bg-cream p-7 shadow-soft">
        <h2 className="mb-5 font-display text-lg font-semibold">Ajouter une couleur</h2>
        <form action={saveInventoryColorAction} className="grid gap-5 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr]">
          <label>
            <span className={label}>Nom</span>
            <input name="name" required className={field} placeholder="PLA rose fluo" />
          </label>
          <label>
            <span className={label}>Couleur</span>
            <input name="hex" type="color" defaultValue="#ff3f7f" className="h-12 w-full cursor-pointer rounded-2xl border border-sand bg-linen p-1" />
          </label>
          <label>
            <span className={label}>Stock (g)</span>
            <input name="stockGrams" type="number" min="0" step="1" defaultValue="1000" className={field} />
          </label>
          <label>
            <span className={label}>Ordre</span>
            <input name="sortOrder" type="number" step="1" defaultValue="0" className={field} />
          </label>
          <label className="md:col-span-3">
            <span className={label}>Note</span>
            <input name="note" className={field} placeholder="Marque, matière, diamètre, emplacement..." />
          </label>
          <label className="flex items-center gap-2.5 self-end pb-3 text-sm font-semibold">
            <input type="checkbox" name="active" defaultChecked className="h-4 w-4 accent-terra" />
            Disponible
          </label>
          <div className="md:col-span-4">
            <button className="rounded-full bg-terra px-8 py-3 text-sm font-bold text-cream transition-colors hover:bg-terra-deep">
              Ajouter à l&apos;inventaire
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-blob bg-cream p-7 shadow-soft">
        <h2 className="mb-5 font-display text-lg font-semibold">Palette disponible</h2>
        {colors.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Aucun filament enregistré pour le moment.
          </p>
        ) : (
          <div className="space-y-4">
            {colors.map((item) => (
              <form
                key={item.id}
                action={saveInventoryColorAction}
                className="grid gap-4 rounded-2xl border border-sand bg-linen p-4 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.5fr_auto]"
              >
                <input type="hidden" name="id" value={item.id} />
                <label>
                  <span className={label}>Nom</span>
                  <input name="name" required defaultValue={item.name} className={field} />
                </label>
                <label>
                  <span className={label}>Couleur</span>
                  <input name="hex" type="color" defaultValue={item.hex} className="h-12 w-full cursor-pointer rounded-2xl border border-sand bg-cream p-1" />
                </label>
                <label>
                  <span className={label}>Stock (g)</span>
                  <input name="stockGrams" type="number" min="0" step="1" defaultValue={item.stockGrams} className={field} />
                </label>
                <label>
                  <span className={label}>Ordre</span>
                  <input name="sortOrder" type="number" step="1" defaultValue={item.sortOrder} className={field} />
                </label>
                <div className="flex items-end gap-3">
                  <span
                    className="mb-2 h-9 w-9 shrink-0 rounded-full border border-ink/10 shadow-soft"
                    style={{ backgroundColor: item.hex }}
                    title={item.hex}
                  />
                  <button className="mb-1 rounded-full bg-ink px-5 py-2.5 text-xs font-bold text-cream hover:bg-ink-soft">
                    Enregistrer
                  </button>
                </div>
                <label className="md:col-span-3">
                  <span className={label}>Note</span>
                  <input name="note" defaultValue={item.note} className={field} />
                </label>
                <label className="flex items-center gap-2.5 self-end pb-3 text-sm font-semibold">
                  <input type="checkbox" name="active" defaultChecked={item.active} className="h-4 w-4 accent-terra" />
                  Disponible
                </label>
                <p className="self-end pb-3 text-sm font-semibold text-ink-soft">
                  {formatKg(item.stockGrams)}
                </p>
              </form>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
