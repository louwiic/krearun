"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/lib/types";
import { cartUnitPriceCents } from "@/lib/quantity-discounts";

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  totalWeightGrams: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, color: string, customName?: string, variantId?: string, keychainChoice?: string) => void;
  setQuantity: (
    productId: string,
    color: string,
    customName: string | undefined,
    quantity: number,
    variantId?: string,
    keychainChoice?: string
  ) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "krearun-cart-v1";

function maxQuantity(item: Pick<CartItem, "stock" | "preorder">) {
  return item.preorder ? 20 : item.stock;
}

function sameLine(
  item: Pick<CartItem, "productId" | "color" | "customName" | "variantId" | "keychainChoice">,
  productId: string,
  color: string,
  customName?: string,
  variantId?: string,
  keychainChoice?: string
) {
  return (
    item.productId === productId &&
    item.color === color &&
    (item.customName ?? "") === (customName ?? "") &&
    (item.variantId ?? "") === (variantId ?? "") &&
    (item.keychainChoice ?? "") === (keychainChoice ?? "")
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as CartItem[];
        // Le panier persistant est restauré une seule fois après l'hydratation client.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(
          saved.map((item) =>
            item.slug === "porte-canette-monster" && !item.quantityDiscounts
              ? {
                  ...item,
                  quantityDiscounts: [
                    { minQuantity: 2, percent: 5 },
                    { minQuantity: 4, percent: 10 },
                    { minQuantity: 8, percent: 20 },
                    { minQuantity: 10, percent: 30 },
                  ],
                }
              : item
          )
        );
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find(
          (i) => sameLine(i, item.productId, item.color, item.customName, item.variantId, item.keychainChoice)
        );
        if (existing) {
          return prev.map((i) =>
            i === existing
              ? {
                  ...i,
                  ...item,
                  quantity: Math.min(i.quantity + quantity, maxQuantity(item)),
                }
              : i
          );
        }
        return [...prev, { ...item, quantity: Math.min(quantity, maxQuantity(item)) }];
      });
      setIsOpen(true);
    },
    []
  );

  const removeItem = useCallback((productId: string, color: string, customName?: string, variantId?: string, keychainChoice?: string) => {
    setItems((prev) =>
      prev.filter((i) => !sameLine(i, productId, color, customName, variantId, keychainChoice))
    );
  }, []);

  const setQuantity = useCallback(
    (productId: string, color: string, customName: string | undefined, quantity: number, variantId?: string, keychainChoice?: string) => {
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((i) => !sameLine(i, productId, color, customName, variantId, keychainChoice))
          : prev.map((i) =>
              sameLine(i, productId, color, customName, variantId, keychainChoice)
                ? { ...i, quantity: Math.min(quantity, maxQuantity(i)) }
                : i
            )
      );
    },
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotalCents: items.reduce((n, i) => n + cartUnitPriceCents(i) * i.quantity, 0),
      totalWeightGrams: items.reduce((n, i) => n + (i.weightGrams ?? 0) * i.quantity, 0),
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      removeItem,
      setQuantity,
      clearCart,
    }),
    [items, isOpen, addItem, removeItem, setQuantity, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans <CartProvider>");
  return ctx;
}
