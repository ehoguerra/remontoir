import Image from "next/image";
import { renderPath } from "@/data/products";
import type { Product } from "@/data/types";

interface Props {
  product: Product;
  sizes: string;
  priority?: boolean;
  /** Crossfade to the caseback render on hover (watches only). */
  hoverBack?: boolean;
  className?: string;
  /** Scale the render inside the frame, to crop the strap. */
  zoom?: number;
}

/**
 * A product render on its plinth. The strap ends fade out at the top and bottom so the watch
 * reads as an object resting in light rather than a cut-out.
 */
export function ProductImage({ product, sizes, priority, hoverBack, className = "", zoom = 1 }: Props) {
  const alt =
    product.kind === "watch"
      ? `${product.name}: ${product.caseLabel.toLowerCase()}, ${product.model.diameter} mm, ${product.complicationLabel.toLowerCase()}`
      : product.name;
  const back = hoverBack && product.kind === "watch";
  return (
    <div className={`plinth group/img relative aspect-square overflow-hidden ${className}`}>
      <div className="strap-fade absolute inset-0" style={{ scale: zoom }}>
        <Image
          src={renderPath(product.slug, "front")}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`object-contain transition-opacity duration-500 ${back ? "group-hover/img:opacity-0" : ""}`}
        />
        {back && (
          <Image
            src={renderPath(product.slug, "back")}
            alt=""
            aria-hidden
            fill
            sizes={sizes}
            className="object-contain opacity-0 transition-opacity duration-500 group-hover/img:opacity-100"
          />
        )}
      </div>
    </div>
  );
}
