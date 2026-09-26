import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, products, relatedProducts, renderPath } from "@/data/products";
import type { Product } from "@/data/types";
import { site } from "@/lib/site";
import { ProductExperience } from "@/components/product/ProductExperience";
import { ProductCard } from "@/components/product/ProductCard";

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/colecao/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProduct(slug);
  if (!product) return {};
  const description = `${product.tagline} ${product.description[0]}`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/colecao/${product.slug}` },
    openGraph: {
      title: `${product.name} — Remontoir`,
      description,
      url: `/colecao/${product.slug}`,
      images: [{ url: renderPath(product.slug), width: 1600, height: 1600, alt: product.name }],
    },
  };
}

const availabilitySchema: Record<Product["availability"], string> = {
  "in-stock": "https://schema.org/InStock",
  "made-to-order": "https://schema.org/PreOrder",
  waitlist: "https://schema.org/BackOrder",
};

function Details({ product }: { product: Product }) {
  return (
    <div className="space-y-10">
      <section aria-labelledby="about-title">
        <h2 id="about-title" className="font-sans text-[0.9375rem] font-semibold">
          Sobre {product.kind === "watch" ? "o relógio" : "a pulseira"}
        </h2>
        <div className="mt-3 space-y-4 text-[1rem] leading-relaxed text-ink-2">
          {product.description.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </section>
      <section aria-labelledby="specs-title">
        <h2 id="specs-title" className="font-sans text-[0.9375rem] font-semibold">
          Ficha técnica
        </h2>
        <dl className="numeric mt-3 divide-y divide-hairline border-y border-hairline text-[0.9375rem]">
          {product.specs.map((s) => (
            <div key={s.label} className="grid grid-cols-[9rem_1fr] gap-4 py-3">
              <dt className="text-ink-2">{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <details className="group border-b border-hairline pb-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-[0.9375rem] font-semibold [&::-webkit-details-marker]:hidden">
          Entrega, troca e garantia
          <span className="text-xl leading-none transition-transform group-open:rotate-45" aria-hidden>
            +
          </span>
        </summary>
        <div className="mt-3 space-y-3 text-[0.9375rem] leading-relaxed text-ink-2">
          <p>
            O relógio sai de São Paulo regulado, com a pulseira escolhida e ajustado ao tamanho que você informar. O
            envio é segurado e a entrega exige assinatura.
          </p>
          <p>
            Se não for o relógio certo, você tem 30 dias para trocar ou devolver, sem custo. Peças com gravação
            personalizada não entram na devolução, só na troca por defeito.
          </p>
        </div>
      </details>
    </div>
  );
}

export default async function ProductPage(props: PageProps<"/colecao/[slug]">) {
  const { slug } = await props.params;
  const product = getProduct(slug);
  if (!product) notFound();
  const related = relatedProducts(product);
  const url = `${site.url}/colecao/${product.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description.join(" "),
    image: `${site.url}${renderPath(product.slug)}`,
    sku: product.slug.toUpperCase(),
    brand: { "@type": "Brand", name: "Remontoir" },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "BRL",
      price: product.price,
      availability: availabilitySchema[product.availability],
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="frame pt-24 pb-24 md:pt-28 md:pb-32">
        <nav aria-label="Trilha" className="mb-8 text-[0.875rem] text-ink-2">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/colecao" className="hover:text-ink">
                Coleção
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={product.kind === "watch" ? "/colecao" : "/colecao?tipo=pulseiras"} className="hover:text-ink">
                {product.kind === "watch" ? "Relógios" : "Pulseiras"}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>

        <ProductExperience product={product} details={<Details product={product} />} />
      </div>

      <section aria-labelledby="related-title" className="border-t border-hairline bg-rhodium-50 py-20 md:py-28">
        <div className="frame">
          <h2 id="related-title" className="display-m">
            {product.kind === "watch" ? "Da mesma bancada" : "Para usar com ela"}
          </h2>
          <ul className="mt-10 grid gap-x-6 gap-y-12 xs:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
