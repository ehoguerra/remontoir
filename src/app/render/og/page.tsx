import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { getProduct, renderPath } from "@/data/products";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Dev-only 1200×630 share cards, photographed by scripts/render-products.mjs: the home card by
 * default, or one product's card with `?slug=`.
 */
export default async function OgCard({ searchParams }: { searchParams: Promise<{ slug?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { slug } = await searchParams;
  const product = slug ? getProduct(slug) : undefined;
  if (slug && !product) notFound();

  return (
    <div
      id="og"
      className="sunray relative flex h-[630px] w-[1200px] items-center overflow-hidden"
      style={{ ["--sun-x" as string]: "74%", ["--sun-y" as string]: "50%" }}
    >
      {product ? (
        <>
          <div className="relative z-10 w-[600px] pl-20">
            <p className="font-display text-[34px] leading-none">Remontoir</p>
            <p
              className={`mt-12 font-display leading-[0.98] tracking-[-0.02em] text-balance ${product.name.length > 14 ? "text-[64px]" : "text-[92px]"}`}
            >
              {product.name}
            </p>
            <p className="mt-6 text-[26px] leading-snug text-ink-2">{product.tagline}</p>
            <p className="numeric mt-10 text-[30px]">{formatPrice(product.price)}</p>
          </div>
          <div className="absolute top-1/2 right-[10px] h-[640px] w-[640px] -translate-y-1/2">
            <Image src={renderPath(product.slug)} alt="" fill priority sizes="640px" className="object-contain" />
          </div>
        </>
      ) : (
        <>
          <div className="relative z-10 w-[640px] pl-20">
            <p className="font-display text-[34px] leading-none">Remontoir</p>
            <p className="mt-10 font-display text-[76px] leading-[0.98] tracking-[-0.02em]">
              Cento e doze horas para marcar um segundo.
            </p>
            <p className="mt-8 text-[22px] text-ink-2">Relojoaria independente. Vallée de Joux e São Paulo.</p>
          </div>
          <div className="absolute top-1/2 right-[-40px] h-[760px] w-[760px] -translate-y-1/2">
            <Image src="/renders/lune-39-hero.webp" alt="" fill priority sizes="760px" className="object-contain" />
          </div>
        </>
      )}
    </div>
  );
}
