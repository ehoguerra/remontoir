"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cartCount, cartSubtotal, useCart } from "@/lib/cart";
import { formatPrice, installments } from "@/lib/format";
import { CloseIcon } from "@/components/ui/icons";
import { CartLines } from "./CartLines";

export function CartDrawer() {
  const ref = useRef<HTMLDialogElement>(null);
  const open = useCart((s) => s.open);
  const setOpen = useCart((s) => s.setOpen);
  const lines = useCart((s) => s.lines);
  const subtotal = cartSubtotal(lines);
  const count = cartCount(lines);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="bag-title"
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-[28rem] bg-rhodium-50 p-0 text-ink shadow-[-24px_0_60px_-30px_rgb(10_17_40/0.45)] open:animate-[drawer-in_320ms_var(--ease-watch)]"
      onClose={() => setOpen(false)}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      data-testid="bag-drawer"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-hairline px-6 py-5">
          <h2 id="bag-title" className="font-display text-[1.6rem] leading-none">
            Sua sacola {count > 0 && <span className="numeric font-sans text-[0.9375rem] text-ink-2">({count})</span>}
          </h2>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-sm hover:text-blued"
            onClick={() => setOpen(false)}
            aria-label="Fechar sacola"
          >
            <CloseIcon />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-start justify-center px-6">
            <p className="font-display text-[1.9rem] leading-tight">Sua sacola está vazia.</p>
            <p className="mt-3 max-w-xs text-ink-2">
              Comece pela coleção: oito relógios e quatro pulseiras, todos com entrega segurada.
            </p>
            <Link href="/colecao" className="btn btn-primary mt-8" onClick={() => setOpen(false)}>
              Ver a coleção
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              <CartLines lines={lines} compact />
            </div>
            <div className="border-t border-hairline px-6 py-6">
              <div className="flex items-baseline justify-between">
                <span className="text-ink-2">Subtotal</span>
                <span className="numeric text-[1.25rem] font-semibold" data-testid="bag-subtotal">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="mt-1 text-right text-[0.8125rem] text-ink-2">{installments(subtotal)}</p>
              <p className="mt-4 text-[0.8125rem] text-ink-2">Entrega segurada e sem custo para todo o Brasil.</p>
              <div className="mt-5 grid gap-2.5">
                <Link href="/checkout" className="btn btn-primary w-full" onClick={() => setOpen(false)}>
                  Finalizar compra
                </Link>
                <Link href="/sacola" className="btn btn-quiet w-full" onClick={() => setOpen(false)}>
                  Ver sacola completa
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
