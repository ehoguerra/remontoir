import Link from "next/link";
import type { Product } from "@/data/types";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./ProductImage";

export function productSummary(p: Product) {
  if (p.kind === "strap") return p.specs[0]?.value ?? "";
  return `${p.complicationLabel}, ${p.caseLabel.toLowerCase()}, ${p.model.diameter} mm`;
}

const availabilityNote = (p: Product) =>
  p.availability === "made-to-order" ? "Sob encomenda" : p.availability === "waitlist" ? "Lista de espera" : null;

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const note = availabilityNote(product);
  return (
    <article className="group relative" data-testid="product-card">
      <ProductImage
        product={product}
        sizes="(min-width: 1024px) 30vw, (min-width: 480px) 48vw, 100vw"
        priority={priority}
        hoverBack
        zoom={product.kind === "watch" ? 1.12 : 1}
      />
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-[1.45rem] leading-tight">
            <Link href={`/colecao/${product.slug}`} className="after:absolute after:inset-0 group-hover:text-blued">
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 text-[0.875rem] text-ink-2">{productSummary(product)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="numeric text-[0.9375rem] font-medium">{formatPrice(product.price)}</p>
          {note && <p className="mt-1 text-[0.8125rem] text-ink-2">{note}</p>}
        </div>
      </div>
    </article>
  );
}
