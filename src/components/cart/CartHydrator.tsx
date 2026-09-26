"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/** Rehydrates the persisted bag after mount, so server and first client render always match. */
export function CartHydrator() {
  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);
  return null;
}
