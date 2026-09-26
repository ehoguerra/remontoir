"use client";

import Image from "next/image";
import Link from "next/link";
import { getProduct, renderPath, strapById } from "@/data/products";
import { MAX_QTY, linePrice, useCart, type CartLine } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";
import { useAnnouncer } from "@/lib/announce";

export function CartLines({ lines, compact = false }: { lines: CartLine[]; compact?: boolean }) {
  return (
    <ul className="divide-y divide-hairline" data-testid="bag-lines">
      {lines.map((line) => (
        <CartLineItem key={line.key} line={line} compact={compact} />
      ))}
    </ul>
  );
}

function CartLineItem({ line, compact }: { line: CartLine; compact: boolean }) {
  const product = getProduct(line.slug);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const setOpen = useCart((s) => s.setOpen);
  const say = useAnnouncer((s) => s.say);
  if (!product) return null;
  const strap = line.strapId ? strapById(line.strapId) : null;
  const size = compact ? 88 : 128;

  return (
    <li className="flex gap-4 py-5" data-testid="bag-line">
      <Link
        href={`/colecao/${product.slug}`}
        onClick={() => setOpen(false)}
        className="plinth relative shrink-0 overflow-hidden rounded-sm"
        style={{ width: size, height: size }}
        tabIndex={-1}
        aria-hidden
      >
        <Image src={renderPath(product.slug)} alt="" fill sizes={`${size}px`} className="object-cover scale-[1.35]" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/colecao/${product.slug}`}
              onClick={() => setOpen(false)}
              className="font-display text-[1.25rem] leading-tight hover:text-blued"
            >
              {product.name}
            </Link>
            <dl className="mt-1 space-y-0.5 text-[0.8125rem] text-ink-2">
              {strap && product.kind === "watch" && (
                <div className="flex gap-1">
                  <dt>Pulseira:</dt>
                  <dd>{strap.name}</dd>
                </div>
              )}
              {line.engraving && (
                <div className="flex gap-1">
                  <dt>Gravação:</dt>
                  <dd className="truncate">“{line.engraving}”</dd>
                </div>
              )}
            </dl>
          </div>
          <p className="numeric shrink-0 text-[0.9375rem] font-medium">{formatPrice(linePrice(line) * line.qty)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div
            className="flex items-center rounded-sm border border-hairline"
            role="group"
            aria-label={`Quantidade de ${product.name}`}
          >
            <button
              type="button"
              className="grid h-9 w-9 place-items-center disabled:opacity-35"
              onClick={() => setQty(line.key, line.qty - 1)}
              disabled={line.qty <= 1}
              aria-label="Diminuir quantidade"
            >
              <MinusIcon width={16} height={16} />
            </button>
            <span className="numeric w-7 text-center text-[0.9375rem]" aria-live="polite" data-testid="line-qty">
              {line.qty}
            </span>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center disabled:opacity-35"
              onClick={() => setQty(line.key, line.qty + 1)}
              disabled={line.qty >= MAX_QTY}
              aria-label="Aumentar quantidade"
            >
              <PlusIcon width={16} height={16} />
            </button>
          </div>
          <button
            type="button"
            className="text-[0.8125rem] text-ink-2 underline-offset-4 hover:text-ruby hover:underline"
            onClick={() => {
              remove(line.key);
              say(`${product.name} removido da sacola`);
            }}
          >
            Remover
          </button>
        </div>
      </div>
    </li>
  );
}
