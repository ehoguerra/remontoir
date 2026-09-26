"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { renderPath } from "@/data/products";
import type { Product } from "@/data/types";
import type { ViewerView } from "@/components/three/ProductCanvas";
import { RotateIcon } from "@/components/ui/icons";
import { useLive3d } from "@/lib/hooks";

const ProductCanvas = dynamic(() => import("@/components/three/ProductCanvas"), { ssr: false });

interface Props {
  product: Product;
  strapId?: string;
  engraving?: string;
  view: ViewerView;
  onViewChange: (v: ViewerView) => void;
}

/**
 * Poster first (the render for the selected view), then the live model fades in over it.
 * The watch in the viewer runs on the visitor's time.
 */
export function ProductViewer({ product, strapId, engraving, view, onViewChange }: Props) {
  const mount3d = useLive3d();
  const [ready, setReady] = useState(false);

  const isWatch = product.kind === "watch";
  const hasLume = isWatch && product.model.lume;
  const views: { value: ViewerView; label: string }[] = isWatch
    ? [
        { value: "front", label: "Mostrador" },
        { value: "back", label: "Fundo" },
        ...(hasLume ? [{ value: "night" as const, label: "No escuro" }] : []),
      ]
    : [];
  const posterView = !isWatch ? "front" : view === "night" && !hasLume ? "front" : view;

  return (
    <div>
      <div
        className={`relative aspect-square overflow-hidden transition-colors duration-700 ${view === "night" ? "bg-night" : "plinth"}`}
        data-testid="viewer"
        data-ready={ready}
      >
        <div className="absolute inset-0 transition-opacity duration-500" style={{ opacity: ready ? 0 : 1 }}>
          <Image
            key={posterView}
            src={renderPath(product.slug, posterView)}
            alt={product.name}
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-contain"
          />
        </div>
        {mount3d && (
          <div
            className="viewer-canvas absolute inset-0 transition-opacity duration-500"
            style={{ opacity: ready ? 1 : 0 }}
          >
            <ProductCanvas
              product={product}
              strapId={strapId}
              engraving={engraving}
              view={view}
              onReady={() => setReady(true)}
            />
          </div>
        )}
        {ready && (
          <p
            className={`pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 text-[0.8125rem] ${view === "night" ? "text-rhodium-200" : "text-ink-2"}`}
          >
            <RotateIcon width={16} height={16} />
            Arraste para girar
          </p>
        )}
      </div>

      {views.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-label="Vista do relógio" className="inline-flex rounded-full bg-ink/[0.07] p-1">
            {views.map((v) => (
              <button
                key={v.value}
                type="button"
                role="radio"
                aria-checked={view === v.value}
                onClick={() => onViewChange(v.value)}
                className="rounded-full px-4 py-2 text-[0.875rem] font-medium text-ink-2 transition-colors hover:text-ink aria-checked:bg-ink aria-checked:text-rhodium-50"
              >
                {v.label}
              </button>
            ))}
          </div>
          {ready && isWatch && <p className="text-[0.8125rem] text-ink-2">Os ponteiros mostram a sua hora agora.</p>}
        </div>
      )}
    </div>
  );
}
