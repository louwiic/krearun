import { saveProductAction } from "@/app/admin/actions";
import { CATEGORIES, type InventoryColor, type Product } from "@/lib/types";

const field =
  "w-full rounded-2xl border border-sand bg-linen px-4 py-3 text-sm outline-none focus:border-terra";
const label = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-soft";

export default function ProductForm({
  product,
  inventoryColors = [],
}: {
  product?: Product;
  inventoryColors?: InventoryColor[];
}) {
  const selectedInventoryIds = new Set(
    inventoryColors
      .filter((item) =>
        product?.colors.some(
          (color) =>
            color.name.toLowerCase() === item.name.toLowerCase() ||
            color.hex.toLowerCase() === item.hex.toLowerCase()
        )
      )
      .map((item) => item.id)
  );
  const customColors = product?.colors.filter(
    (color) =>
      !inventoryColors.some(
        (item) =>
          color.name.toLowerCase() === item.name.toLowerCase() ||
          color.hex.toLowerCase() === item.hex.toLowerCase()
      )
  ) ?? [];

  return (
    <form action={saveProductAction} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="rounded-blob bg-cream p-7 shadow-soft">
        <h2 className="mb-5 font-display text-lg font-semibold">L'essentiel</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={label}>Nom de l'objet *</span>
            <input name="name" required defaultValue={product?.name} className={field} placeholder="Veilleuse Lune" />
          </label>
          <label>
            <span className={label}>Slug (URL)</span>
            <input name="slug" defaultValue={product?.slug} className={field} placeholder="généré automatiquement" />
          </label>
          <label>
            <span className={label}>Catégorie</span>
            <select name="category" defaultValue={product?.category ?? "deco"} className={field}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className={label}>Phrase douce (accroche)</span>
            <input name="tagline" defaultValue={product?.tagline} className={field} placeholder="Un croissant de douceur pour vos nuits" />
          </label>
          <label className="sm:col-span-2">
            <span className={label}>Description</span>
            <textarea
              name="description"
              rows={7}
              defaultValue={product?.description}
              className={field}
              placeholder={"Racontez l'objet, sa fabrication…\n\n• Dimensions\n• Matière"}
            />
          </label>
        </div>
      </div>

      <div className="rounded-blob bg-cream p-7 shadow-soft">
        <h2 className="mb-5 font-display text-lg font-semibold">Prix & stock</h2>
        <div className="grid gap-5 sm:grid-cols-4">
          <label>
            <span className={label}>Prix (€) *</span>
            <input
              name="price"
              required
              type="number"
              step="0.01"
              min="0"
              defaultValue={product ? (product.priceCents / 100).toFixed(2) : ""}
              className={field}
              placeholder="39.00"
            />
          </label>
          <label>
            <span className={label}>Prix barré (€)</span>
            <input
              name="compareAt"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.compareAtCents ? (product.compareAtCents / 100).toFixed(2) : ""}
              className={field}
              placeholder="optionnel"
            />
          </label>
          <label>
            <span className={label}>Stock</span>
            <input
              name="stock"
              type="number"
              min="0"
              defaultValue={product?.stock ?? 10}
              className={field}
            />
          </label>
          <label>
            <span className={label}>Poids (g)</span>
            <input
              name="weightGrams"
              type="number"
              min="0"
              step="1"
              defaultValue={product?.weightGrams ?? 120}
              className={field}
              placeholder="120"
            />
          </label>
        </div>
      </div>

      <div className="rounded-blob bg-cream p-7 shadow-soft">
        <h2 className="mb-5 font-display text-lg font-semibold">Médias & coloris</h2>
        <div className="space-y-5">
          {product && product.images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {product.images.map((img) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={img} src={img} alt="" className="h-20 w-20 rounded-2xl object-cover shadow-soft" />
              ))}
            </div>
          )}
          <label>
            <span className={label}>URLs des images (1 à 3, une par ligne)</span>
            <textarea
              name="images"
              rows={3}
              defaultValue={product?.images.slice(0, 3).join("\n")}
              className={`${field} font-mono text-xs`}
              placeholder={"/products/mon-objet.svg\n/uploads/photo.jpg"}
            />
          </label>
          <div>
            <span className={label}>Ajouter des photos (max 3 au total, converties en WebP)</span>
            <input
              name="nouvelles_images"
              type="file"
              multiple
              accept="image/*"
              className="block w-full cursor-pointer text-sm text-ink-soft file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-sage/25 file:px-5 file:py-2.5 file:text-xs file:font-bold file:text-sage-deep hover:file:bg-sage/40"
            />
          </div>
          {product?.videoUrl ? (
            <div className="max-w-xs overflow-hidden rounded-2xl bg-ink shadow-soft">
              <video
                src={product.videoUrl}
                className="aspect-video w-full object-cover"
                controls
                muted
                playsInline
              />
            </div>
          ) : null}
          <label>
            <span className={label}>URL vidéo courte (optionnelle)</span>
            <input
              name="videoUrl"
              defaultValue={product?.videoUrl}
              className={`${field} font-mono text-xs`}
              placeholder="https://.../video.mp4"
            />
          </label>
          <div>
            <span className={label}>Ajouter/remplacer une vidéo courte</span>
            <input
              name="nouvelle_video"
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/*"
              className="block w-full cursor-pointer text-sm text-ink-soft file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-sage/25 file:px-5 file:py-2.5 file:text-xs file:font-bold file:text-sage-deep hover:file:bg-sage/40"
            />
          </div>
          {inventoryColors.length > 0 ? (
            <div>
              <span className={label}>Coloris disponibles depuis l&apos;inventaire</span>
              <div className="grid gap-3 sm:grid-cols-2">
                {inventoryColors.map((item) => (
                  <label
                    key={item.id}
                    className="flex min-h-14 items-center gap-3 rounded-2xl border border-sand bg-linen px-4 py-3 text-sm font-semibold text-ink-soft"
                  >
                    <input
                      type="checkbox"
                      name="inventoryColorIds"
                      value={item.id}
                      defaultChecked={selectedInventoryIds.has(item.id)}
                      className="h-4 w-4 accent-terra"
                    />
                    <span
                      className="h-7 w-7 shrink-0 rounded-full border border-ink/10 shadow-soft"
                      style={{ backgroundColor: item.hex }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-ink">{item.name}</span>
                      <span className="block text-xs font-medium text-ink-faint">
                        {Math.round(item.stockGrams / 10) / 100} kg en stock
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          <label>
            <span className={label}>
              Coloris libres — format « Nom:#hex » séparés par des virgules
            </span>
            <input
              name="colors"
              defaultValue={customColors.map((c) => `${c.name}:${c.hex}`).join(", ")}
              className={`${field} font-mono text-xs`}
              placeholder="Crème:#f3ead9, Sauge:#b8c8a8"
            />
          </label>
        </div>
      </div>

      <div className="rounded-blob bg-cream p-7 shadow-soft">
        <h2 className="mb-5 font-display text-lg font-semibold">Visibilité</h2>
        <div className="flex flex-wrap gap-8 text-sm font-semibold">
          <label className="flex items-center gap-2.5">
            <input type="checkbox" name="active" defaultChecked={product?.active ?? true} className="h-4 w-4 accent-terra" />
            En ligne sur la boutique
          </label>
          <label className="flex items-center gap-2.5">
            <input type="checkbox" name="featured" defaultChecked={product?.featured} className="h-4 w-4 accent-terra" />
            Coup de cœur (accueil)
          </label>
          <label className="flex items-center gap-2.5">
            <input type="checkbox" name="isNew" defaultChecked={product?.isNew} className="h-4 w-4 accent-terra" />
            Badge « Nouveau »
          </label>
          <label className="flex items-center gap-2.5">
            <input type="checkbox" name="preorder" defaultChecked={product?.preorder} className="h-4 w-4 accent-terra" />
            Pré-commande / bientôt disponible
          </label>
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              name="namePersonalizationEnabled"
              defaultChecked={product?.namePersonalizationEnabled}
              className="h-4 w-4 accent-terra"
            />
            Prénom personnalisable
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        <button
          type="submit"
          className="rounded-full bg-terra px-10 py-3.5 text-sm font-bold text-cream transition-colors hover:bg-terra-deep"
        >
          {product ? "Enregistrer les modifications" : "Créer l'objet"}
        </button>
      </div>
    </form>
  );
}
