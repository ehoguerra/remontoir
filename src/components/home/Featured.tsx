import Link from "next/link";
import { getProduct } from "@/data/products";
import type { WatchProduct } from "@/data/types";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "@/components/product/ProductImage";
import { NocturneBand } from "./NocturneBand";

function Specs({ watch }: { watch: WatchProduct }) {
  const items = [
    { label: "Caixa", value: watch.caseLabel },
    { label: "Diâmetro", value: `${watch.model.diameter} mm` },
    { label: "Calibre", value: watch.calibre },
  ];
  return (
    <dl className="numeric grid grid-cols-3 border-y border-hairline py-4 text-[0.9375rem]">
      {items.map((i) => (
        <div key={i.label}>
          <dt className="text-[0.8125rem] text-ink-2">{i.label}</dt>
          <dd className="mt-0.5 font-medium">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function FeatureRow({ watch, reverse = false }: { watch: WatchProduct; reverse?: boolean }) {
  return (
    <article className="grid items-center gap-8 md:grid-cols-12 md:gap-10" data-testid="featured-item">
      <Link
        href={`/colecao/${watch.slug}`}
        className={`md:col-span-7 ${reverse ? "md:order-2" : ""}`}
        aria-label={`${watch.name}, ver detalhes`}
      >
        <ProductImage product={watch} sizes="(min-width: 768px) 55vw, 100vw" hoverBack zoom={1.18} />
      </Link>
      <div className={`md:col-span-5 ${reverse ? "md:order-1 md:pr-6" : "md:pl-4"}`}>
        {watch.edition && <p className="text-[0.9375rem] font-medium text-ruby">{watch.edition}</p>}
        <h3 className="display-l mt-2">{watch.name}</h3>
        <p className="lede mt-4">{watch.description[0]}</p>
        <div className="mt-8">
          <Specs watch={watch} />
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          <p className="numeric text-[1.35rem] font-medium">{formatPrice(watch.price)}</p>
          <Link href={`/colecao/${watch.slug}`} className="btn btn-quiet">
            Ver o {watch.name}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function Featured() {
  const regulateur = getProduct("regulateur-39") as WatchProduct;
  const nocturne = getProduct("nocturne-40") as WatchProduct;
  const chrono = getProduct("chronographe-41") as WatchProduct;

  return (
    <section aria-labelledby="featured-title" className="py-24 md:py-36">
      <div className="frame">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="featured-title" className="display-l max-w-2xl">
              Três relógios para começar.
            </h2>
            <p className="lede mt-4">Um regulador de oficina, um relógio que se lê no escuro e um cronógrafo panda.</p>
          </div>
          <Link href="/colecao" className="link shrink-0 text-[0.9375rem] font-medium">
            Ver os oito relógios
          </Link>
        </div>

        <div className="mt-16 md:mt-24">
          <FeatureRow watch={regulateur} />
        </div>
      </div>

      <div className="mt-24 md:mt-36">
        <NocturneBand watch={nocturne} />
      </div>

      <div className="frame mt-24 md:mt-36">
        <FeatureRow watch={chrono} reverse />
      </div>
    </section>
  );
}
