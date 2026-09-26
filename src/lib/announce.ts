"use client";

import { create } from "zustand";

/** A single polite live region for status messages (bag updates, form results). */
export const useAnnouncer = create<{ message: string; say: (m: string) => void }>((set) => ({
  message: "",
  say: (message) => {
    set({ message: "" });
    // re-set on the next frame so repeated messages are announced again
    requestAnimationFrame(() => set({ message }));
  },
}));
