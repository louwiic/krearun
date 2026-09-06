"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { bulkUpdateProductsAction } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";
import { CATEGORIES, type Product } from "@/lib/types";

interface ProductBulkTableProps {
  products: Product[];
}

export function ProductBulkTable({ products }: ProductBulkTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);
  const allSelected = products.length > 0 && selectedIds.size === products.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedIds.size > 0 && !allSelected;
    }
  }, [allSelected, selectedIds.size]);

  function toggleProduct(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(products.map((product) => product.id)));
  }

  return (
    <form action={bulkUpdateProductsAction}>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-sand/70 bg-cream px-4 py-3 shadow-soft">
        <span className="min-w-28 text-sm font-bold text-ink">
          {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
        </span>
        <select
          name="bulk_action"
          aria-label="Action groupée"
          defaultValue=""
          disabled={selectedIds.size === 0}
          required
          className="min-w-56 flex-1 rounded-xl border border-sand bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-terra disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="" disabled>Choisir une action</option>
          <option value="publish">Mettre en ligne</option>
          <option value="hide">Masquer</option>
          <option value="new_on">Ajouter le badge NEW</option>
          <option value="new_off">Retirer le badge NEW</option>
          <option value="preorder_on">Activer la précommande</option>
          <option value="preorder_off">Désactiver la précommande</option>
          <option value="featured_on">Ajouter aux coups de cœur</option>
          <option value="featured_off">Retirer des coups de cœur</option>
          <option value="partner_on">Partager aux partenaires</option>
          <option value="partner_off">Ne plus partager aux partenaires</option>
        </select>
        <button
          type="submit"
          disabled={selectedIds.size === 0}
          className="rounded-full bg-terra px-5 py-2.5 text-sm font-bold text-cream transition-colors hover:bg-terra-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          Appliquer
        </button>
        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="rounded-full px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-linen"
          >
            Annuler
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-blob bg-cream shadow-soft">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-sand/70 text-xs uppercase tracking-wide text-ink-faint">
              <th className="w-14 px-5 py-4">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Sélectionner tous les produits"
                  className="h-5 w-5 cursor-pointer accent-terra"
                />
              </th>
              <th className="px-2 py-4 font-bold">Objet</th>
              <th className="hidden px-5 py-4 font-bold sm:table-cell">Catégorie</th>
              <th className="px-5 py-4 font-bold">Prix</th>
              <th className="px-5 py-4 font-bold">Stock</th>
              <th className="hidden px-5 py-4 font-bold md:table-cell">Statut</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const selected = selectedIds.has(product.id);
              return (
                <tr
                  key={product.id}
                  className={`border-b border-sand/40 last:border-0 ${selected ? "bg-sage/15" : "hover:bg-linen/60"}`}
                >
                  <td className="px-5 py-3">
                    <input
                      type="checkbox"
                      name="ids"
                      value={product.id}
                      checked={selected}
                      onChange={() => toggleProduct(product.id)}
                      aria-label={`Sélectionner ${product.name}`}
                      className="h-5 w-5 cursor-pointer accent-terra"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <Link href={`/admin/produits/${product.id}`} className="flex items-center gap-3 font-semibold hover:text-terra">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.images[0] ?? "/products/hero.svg"} alt="" className="h-11 w-11 rounded-xl object-cover" />
                      <span>
                        {product.name}
                        {product.featured && <span className="ml-2" title="Coup de cœur">💛</span>}
                        {product.isNew && <span className="ml-1 rounded-full bg-sage/30 px-2 py-0.5 text-[10px] font-bold text-sage-deep">NEW</span>}
                        {product.preorder && <span className="ml-1 rounded-full bg-terra/15 px-2 py-0.5 text-[10px] font-bold text-terra-deep">PRÉCO</span>}
                        {product.partnerShared && <span className="ml-1 rounded-full bg-sage/30 px-2 py-0.5 text-[10px] font-bold text-sage-deep">PARTENAIRE</span>}
                        {product.videoUrl && <span className="ml-1 rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink-soft">VIDÉO</span>}
                      </span>
                    </Link>
                  </td>
                  <td className="hidden px-5 py-3 text-ink-soft sm:table-cell">
                    {CATEGORIES.find((category) => category.value === product.category)?.label ?? product.category}
                  </td>
                  <td className="px-5 py-3 font-bold">{formatPrice(product.priceCents)}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      product.stock === 0
                        ? "bg-blush/50 text-terra-deep"
                        : product.stock <= 3
                          ? "bg-sand/70 text-ink-soft"
                          : "bg-sage/25 text-sage-deep"
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="hidden px-5 py-3 md:table-cell">
                    {product.active ? (
                      <span className="text-xs font-bold text-sage-deep">
                        ● En ligne
                        {product.preorder && <span className="ml-2 text-terra-deep">· Pré-commande</span>}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-ink-faint">○ Masqué</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </form>
  );
}
