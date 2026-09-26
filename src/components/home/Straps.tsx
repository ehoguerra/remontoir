import Link from "next/link";
import { strapProductsList } from "@/data/products";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "@/components/product/ProductImage";

export function Straps() {
  return (
    <section aria-labelledby="straps-title" className="py-24 md:py-32">
      <div className="frame">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="straps-title" className="display-l max-w-xl">
              Troque de pulseira em dez segundos.
            </h2>
            <p className="lede mt-4">
              Todas têm barras de mola com liberação rápida: sem ferramenta e sem risco de marcar a caixa.
            </p>
          </div>
          <Link href="/colecao?tipo=pulseiras" className="link shrink-0 text-[0.9375rem] font-medium">
            Ver todas as pulseiras
          </Link>
        </div>
        <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {strapProductsList.map((p) => (
            <li key={p.slug}>
              <Link href={`/colecao/${p.slug}`} className="group block">
                <ProductImage product={p} sizes="(min-width: 768px) 22vw, 48vw" />
                <h3 className="mt-4 font-sans text-[0.9375rem] font-medium group-hover:text-blued">{p.strap.name}</h3>
                <p className="numeric mt-0.5 text-[0.9375rem] text-ink-2">{formatPrice(p.price)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
