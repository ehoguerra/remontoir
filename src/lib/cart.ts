"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getProduct } from "@/data/products";

export const ENGRAVING_PRICE = 800;
export const MAX_QTY = 3;

export interface CartLine {
  key: string;
  slug: string;
  strapId?: string;
  engraving?: string;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  open: boolean;
  lastAdded?: string;
  add: (line: Omit<CartLine, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
}

export const lineKey = (l: Pick<CartLine, "slug" | "strapId" | "engraving">) =>
  [l.slug, l.strapId ?? "", (l.engraving ?? "").trim()].join("|");

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      add: (line, qty = 1) =>
        set((state) => {
          const key = lineKey(line);
          const existing = state.lines.find((l) => l.key === key);
          const lines = existing
            ? state.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l))
            : [...state.lines, { ...line, key, qty: Math.min(MAX_QTY, qty) }];
          return { lines, open: true, lastAdded: key };
        }),
      setQty: (key, qty) =>
        set((state) => ({
          lines: state.lines.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : l)),
        })),
      remove: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "remontoir-bag",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines }),
      skipHydration: true,
    },
  ),
);

export const linePrice = (line: CartLine) => {
  const product = getProduct(line.slug);
  if (!product) return 0;
  return product.price + (line.engraving ? ENGRAVING_PRICE : 0);
};

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);

export const cartSubtotal = (lines: CartLine[]) => lines.reduce((sum, l) => sum + linePrice(l) * l.qty, 0);

/** True once the persisted bag has been read from localStorage (always false on the server). */
export function useCartHydrated() {
  return useSyncExternalStore(
    (onChange) => useCart.persist.onFinishHydration(onChange),
    () => useCart.persist.hasHydrated(),
    () => false,
  );
}
