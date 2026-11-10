"use client";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import type { CartItem } from "@/lib/types";
export default function RestoreReminderCart({ items }: { items: CartItem[] }) {
  const { restoreCart, count } = useCart();
  const router = useRouter();
  return <><p className="mt-4">{items.reduce((sum, item) => sum + item.quantity, 0)} article(s) encore disponible(s). Les prix et disponibilités sont actualisés.</p>{count > 0 && <p className="mt-3 text-sm">Ce panier remplacera le panier actuellement enregistré sur ce navigateur.</p>}<button type="button" onClick={() => { restoreCart(items); router.replace("/panier"); }} className="mt-6 rounded-full bg-terra px-6 py-3 font-bold text-white">Reprendre ce panier</button></>;
}
