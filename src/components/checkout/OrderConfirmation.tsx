"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSessionItem } from "@/lib/hooks";
import { formatPrice } from "@/lib/format";
import type { PlacedOrder } from "./CheckoutForm";

/** A QR-like pattern seeded by the order number. Decorative: it is not a scannable Pix code. */
function DemoQr({ seed }: { seed: string }) {
  const n = 25;
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    for (const [ox, oy] of [
      [0, 0],
      [n - 7, 0],
      [0, n - 7],
    ]) {
      if (inBox(ox, oy)) {
        const dx = x - ox;
        const dy = y - oy;
        const ring = dx === 0 || dy === 0 || dx === 6 || dy === 6;
        const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        return ring || core ? 1 : 0;
      }
    }
    return -1;
  };
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const f = finder(x, y);
      if (f === 1 || (f === -1 && rand() > 0.52)) cells.push({ x, y });
    }
  }
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} className="h-44 w-44" role="img" aria-label="Código Pix de demonstração">
      <rect x={-2} y={-2} width={n + 4} height={n + 4} fill="#fff" />
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width={1.02} height={1.02} fill="#101b3d" />
      ))}
    </svg>
  );
}

export function OrderConfirmation() {
  const raw = useSessionItem("remontoir-order");
  const [copied, setCopied] = useState(false);
  const order = useMemo<PlacedOrder | null | undefined>(() => {
    if (raw === undefined) return undefined;
    try {
      return raw ? (JSON.parse(raw) as PlacedOrder) : null;
    } catch {
      return null;
    }
  }, [raw]);

  if (order === undefined) return <div className="h-96 animate-pulse rounded-sm bg-rhodium-50/60" aria-hidden />;

  if (!order) {
    return (
      <div className="max-w-xl">
        <h1 className="display-l">Nenhum pedido recente.</h1>
        <p className="lede mt-4">A confirmação aparece aqui logo depois de finalizar uma compra.</p>
        <Link href="/colecao" className="btn btn-primary mt-8">
          Ver a coleção
        </Link>
      </div>
    );
  }

  const pixCode = `00020126REMONTOIR-DEMO-${order.id}-5204000053039865802BR`;

  return (
    <div className="grid gap-12 lg:grid-cols-12" data-testid="order-confirmed">
      <div className="lg:col-span-7">
        <p className="numeric text-[0.9375rem] text-ink-2">Pedido {order.id}</p>
        <h1 className="display-xl mt-3">Pedido confirmado.</h1>
        <p className="lede mt-6">
          Enviamos a confirmação para <strong className="font-semibold text-ink">{order.email}</strong>.{" "}
          {order.delivery === "boutique"
            ? "Avisaremos quando o relógio estiver regulado e pronto para retirada na boutique."
            : "O relógio sai regulado da boutique e chega com seguro e assinatura na entrega."}
        </p>
        <dl className="numeric mt-10 grid max-w-lg grid-cols-2 gap-6 border-t border-hairline pt-6 text-[0.9375rem]">
          <div>
            <dt className="text-ink-2">Total</dt>
            <dd className="mt-1 font-display text-[1.75rem] leading-none">{formatPrice(order.total)}</dd>
          </div>
          <div>
            <dt className="text-ink-2">Pagamento</dt>
            <dd className="mt-1 text-[1.0625rem] font-medium">
              {order.payment === "pix" ? "Pix" : "Cartão de crédito"}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-ink-2">Itens</dt>
            <dd className="mt-1">
              {order.items.map((i) => (
                <span key={i.name} className="block">
                  {i.qty} × {i.name}
                </span>
              ))}
            </dd>
          </div>
        </dl>
        <Link href="/colecao" className="btn btn-quiet mt-10">
          Voltar à coleção
        </Link>
      </div>

      {order.payment === "pix" && (
        <aside className="lg:col-span-4 lg:col-start-9" aria-label="Pagamento via Pix">
          <div className="rounded-sm bg-rhodium-50 p-6">
            <h2 className="font-display text-[1.6rem]">Pague com Pix</h2>
            <p className="mt-2 text-[0.9375rem] text-ink-2">
              Aponte a câmera do app do banco ou copie o código abaixo.
            </p>
            <div className="mt-5 flex justify-center rounded-sm bg-white p-4">
              <DemoQr seed={order.id} />
            </div>
            <button
              type="button"
              className="btn btn-quiet mt-5 w-full"
              onClick={() => {
                navigator.clipboard?.writeText(pixCode).then(() => setCopied(true));
              }}
            >
              {copied ? "Código copiado" : "Copiar código Pix"}
            </button>
            <p className="mt-3 text-[0.8125rem] text-ink-2">Demonstração: este código não gera cobrança.</p>
          </div>
        </aside>
      )}
    </div>
  );
}
