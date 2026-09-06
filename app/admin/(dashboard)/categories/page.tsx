import { saveCategoriesAction } from "@/app/admin/actions";
import { parseStoreCategories } from "@/lib/categories";
import { getProducts, getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [settings, products] = await Promise.all([
    getSettings(),
    getProducts({ includeInactive: true }),
  ]);
  const categories = parseStoreCategories(settings.categories_json);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold">Catégories</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Renommez ou masquez une catégorie. Les produits associés restent conservés
          dans l’administration.
        </p>
      </div>

      <form action={saveCategoriesAction} className="space-y-5">
        <div className="overflow-hidden rounded-blob bg-cream shadow-soft">
          {categories.map((category) => {
            const count = products.filter((product) => product.category === category.value).length;
            return (
              <div
                key={category.value}
                className="grid gap-4 border-b border-sand/60 px-5 py-5 last:border-0 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <label htmlFor={`label_${category.value}`} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-soft">
                    Nom affiché
                  </label>
                  <input
                    id={`label_${category.value}`}
                    name={`label_${category.value}`}
                    defaultValue={category.label}
                    required
                    maxLength={80}
                    className="w-full rounded-2xl border border-sand bg-linen px-4 py-3 text-sm font-semibold outline-none focus:border-terra"
                  />
                  <p className="mt-1.5 text-xs text-ink-faint">
                    {count} produit{count > 1 ? "s" : ""} · identifiant : {category.value}
                  </p>
                </div>
                <label className="flex min-w-36 items-center gap-3 rounded-2xl bg-linen px-4 py-3 text-sm font-bold text-ink-soft">
                  <input
                    type="checkbox"
                    name={`active_${category.value}`}
                    defaultChecked={category.active}
                    className="h-5 w-5 accent-terra"
                  />
                  Visible
                </label>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button className="rounded-full bg-terra px-7 py-3 text-sm font-bold text-cream transition-colors hover:bg-terra-deep">
            Enregistrer les catégories
          </button>
        </div>
      </form>
    </div>
  );
}
