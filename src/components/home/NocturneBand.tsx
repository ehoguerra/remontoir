"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { renderPath } from "@/data/products";
import type { WatchProduct } from "@/data/types";
import { formatPrice } from "@/lib/format";

/** A dark band for the lume watch, with a switch between daylight and darkness. */
export function NocturneBand({ watch }: { watch: WatchProduct }) {
  const [dark, setDark] = useState(true);
  return (
    <article
      className={`transition-colors duration-700 ${dark ? "bg-night text-rhodium-50" : "bg-rhodium-200 text-ink"}`}
      data-testid="featured-item"
      aria-labelledby="nocturne-title"
    >
      <div className="frame grid items-center gap-8 py-16 md:grid-cols-12 md:gap-10 md:py-24">
        <div className="md:col-span-5">
          <h3 id="nocturne-title" className="display-l">
            {watch.name}
          </h3>
          <p className={`lede mt-4 ${dark ? "!text-rhodium-200" : ""}`}>{watch.description[0]}</p>
          <div className="mt-8 flex items-center gap-4">
            <span className="text-[0.9375rem]" id="lume-label">
              Ver o mostrador
            </span>
            <div
              role="radiogroup"
              aria-labelledby="lume-label"
              className={`inline-flex rounded-full p-1 ${dark ? "bg-white/10" : "bg-ink/10"}`}
            >
              {[
                { value: false, label: "De dia" },
                { value: true, label: "No escuro" },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  role="radio"
                  aria-checked={dark === o.value}
                  onClick={() => setDark(o.value)}
                  className={`rounded-full px-4 py-2 text-[0.875rem] font-medium transition-colors ${
                    dark === o.value
                      ? dark
                        ? "bg-lume text-night"
                        : "bg-ink text-rhodium-50"
                      : "opacity-80 hover:opacity-100"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <p className="numeric text-[1.35rem] font-medium">{formatPrice(watch.price)}</p>
            <Link href={`/colecao/${watch.slug}`} className={`btn ${dark ? "btn-on-night" : "btn-quiet"}`}>
              Ver o {watch.name}
            </Link>
          </div>
        </div>
        <Link
          href={`/colecao/${watch.slug}`}
          className="relative aspect-square md:col-span-7"
          aria-label={`${watch.name}, ver detalhes`}
        >
          <div className="strap-fade absolute inset-0" style={{ scale: 1.18 }}>
            <Image
              src={renderPath(watch.slug, "front")}
              alt={`${watch.name} à luz do dia`}
              fill
              sizes="(min-width: 768px) 55vw, 100vw"
              className={`object-contain transition-opacity duration-700 ${dark ? "opacity-0" : "opacity-100"}`}
            />
            <Image
              src={renderPath(watch.slug, "night")}
              alt={`${watch.name} no escuro, com os índices e ponteiros brilhando`}
              fill
              sizes="(min-width: 768px) 55vw, 100vw"
              className={`object-contain transition-opacity duration-700 ${dark ? "opacity-100" : "opacity-0"}`}
            />
          </div>
        </Link>
      </div>
    </article>
  );
}
