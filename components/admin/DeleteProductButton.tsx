"use client";

import { deleteProductAction } from "@/app/admin/actions";

export default function DeleteProductButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <form
      action={deleteProductAction}
      onSubmit={(e) => {
        if (!confirm(`Supprimer définitivement « ${name} » ?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-full border border-blush px-6 py-3 text-sm font-bold text-terra-deep transition-colors hover:bg-blush/30"
      >
        Supprimer cet objet
      </button>
    </form>
  );
}
