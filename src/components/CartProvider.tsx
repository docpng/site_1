"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ProductKind } from "@/lib/types";

export type CartItem = {
  id: string;
  slug: string;
  title: string;
  price_cents: number;
  kind: ProductKind;
  image: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "site_cart_v1";

function maxQty(kind: ProductKind) {
  return kind === "physical" ? 99 : 1;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage once on mount
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = useCallback<CartContextValue["add"]>((item, quantity = 1) => {
    if (item.kind === "free") return;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: Math.min(i.quantity + quantity, maxQty(i.kind)) } : i,
        );
      }
      return [...prev, { ...item, quantity: Math.min(quantity, maxQty(item.kind)) }];
    });
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, Math.min(quantity, maxQty(i.kind))) } : i))
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const remove = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      ready,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.quantity * i.price_cents, 0),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [items, ready, add, setQuantity, remove, clear],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
