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

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  totalWeightGrams: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, color: string) => void;
  setQuantity: (productId: string, color: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "krearun-cart-v1";

function maxQuantity(item: Pick<CartItem, "stock" | "preorder">) {
  return item.preorder ? 20 : item.stock;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
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
          (i) => i.productId === item.productId && i.color === item.color
        );
        if (existing) {
          return prev.map((i) =>
            i === existing
              ? { ...i, quantity: Math.min(i.quantity + quantity, maxQuantity(i)) }
              : i
          );
        }
        return [...prev, { ...item, quantity: Math.min(quantity, maxQuantity(item)) }];
      });
      setIsOpen(true);
    },
    []
  );

  const removeItem = useCallback((productId: string, color: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.color === color))
    );
  }, []);

  const setQuantity = useCallback(
    (productId: string, color: string, quantity: number) => {
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((i) => !(i.productId === productId && i.color === color))
          : prev.map((i) =>
              i.productId === productId && i.color === color
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
      subtotalCents: items.reduce((n, i) => n + i.priceCents * i.quantity, 0),
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
