"use client";

import Link from "next/link";
import { cartCount, cartSubtotal, useCart, useCartHydrated } from "@/lib/cart";
import { formatPrice, installments } from "@/lib/format";
import { CartLines } from "./CartLines";

export function BagView() {
  const lines = useCart((s) => s.lines);
  const hydrated = useCartHydrated();

  if (!hydrated) return <div className="mt-12 h-64 animate-pulse rounded-sm bg-rhodium-50/60" aria-hidden />;

  if (lines.length === 0) {
    return (
      <div className="mt-12 max-w-xl" data-testid="bag-empty">
        <p className="font-display text-[2rem] leading-tight">Sua sacola está vazia.</p>
        <p className="mt-3 text-ink-2">
          Comece pela coleção: oito relógios e quatro pulseiras, todos com entrega segurada.
        </p>
        <Link href="/colecao" className="btn btn-primary mt-8">
          Ver a coleção
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(lines);
  return (
    <div className="mt-12 grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <p className="text-[0.9375rem] text-ink-2">
          {cartCount(lines)} {cartCount(lines) === 1 ? "item" : "itens"}
        </p>
        <div className="mt-2 border-t border-hairline">
          <CartLines lines={lines} />
        </div>
      </div>
      <aside className="lg:col-span-4 lg:col-start-9" aria-label="Resumo">
        <div className="rounded-sm bg-rhodium-50 p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-[1.6rem]">Resumo</h2>
          <dl className="numeric mt-5 space-y-3 text-[0.9375rem]">
            <div className="flex justify-between">
              <dt className="text-ink-2">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-2">Entrega segurada</dt>
              <dd>Grátis</dd>
            </div>
            <div className="flex justify-between border-t border-hairline pt-3 text-[1.125rem] font-semibold">
              <dt>Total</dt>
              <dd data-testid="bag-total">{formatPrice(subtotal)}</dd>
            </div>
          </dl>
          <p className="mt-1 text-right text-[0.8125rem] text-ink-2">{installments(subtotal)}</p>
          <Link href="/checkout" className="btn btn-primary mt-6 w-full">
            Finalizar compra
          </Link>
          <p className="mt-4 text-[0.8125rem] leading-relaxed text-ink-2">
            Pix com 5% de desconto ou cartão em até 10 vezes sem juros.
          </p>
        </div>
      </aside>
    </div>
  );
}
