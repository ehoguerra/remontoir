"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import {
  applyFilters,
  caseOptions,
  complicationOptions,
  hasActiveFilters,
  orderOptions,
  parseFilters,
  type Filters,
  type Tipo,
} from "@/lib/catalog";
import { products } from "@/data/products";
import { ProductCard } from "./ProductCard";

const tabs: { value: Tipo; label: string }[] = [
  { value: "relogios", label: "Relógios" },
  { value: "pulseiras", label: "Pulseiras" },
  { value: "todos", label: "Tudo" },
];

const countLabel = (n: number, tipo: Tipo) => {
  const noun =
    tipo === "pulseiras"
      ? ["pulseira", "pulseiras"]
      : tipo === "relogios"
        ? ["relógio", "relógios"]
        : ["peça", "peças"];
  return `${n} ${n === 1 ? noun[0] : noun[1]}`;
};

export function CollectionView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const filters = useMemo(() => parseFilters(new URLSearchParams(params.toString())), [params]);
  const list = useMemo(() => applyFilters(filters), [filters]);

  const update = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    if (next.tipo === "pulseiras") {
      next.complicacao = "";
      next.caixa = "";
    }
    const q = new URLSearchParams();
    if (next.tipo !== "relogios") q.set("tipo", next.tipo);
    if (next.complicacao) q.set("complicacao", next.complicacao);
    if (next.caixa) q.set("caixa", next.caixa);
    if (next.ordem !== "destaque") q.set("ordem", next.ordem);
    const qs = q.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const clear = () => update({ complicacao: "", caixa: "", ordem: "destaque" });
  const watchFilters = filters.tipo !== "pulseiras";

  return (
    <>
      <div className="z-20 border-y border-hairline bg-rhodium/90 backdrop-blur-md md:sticky md:top-[4.5rem]">
        <div className="frame flex flex-wrap items-center gap-x-6 gap-y-3 py-3">
          <div role="group" aria-label="Tipo de peça" className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.value}
                type="button"
                aria-pressed={filters.tipo === t.value}
                onClick={() => update({ tipo: t.value })}
                className="rounded-full px-4 py-2 text-[0.9375rem] font-medium text-ink-2 transition-colors hover:text-ink aria-pressed:bg-ink aria-pressed:text-rhodium-50"
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-3 md:justify-end">
            {watchFilters && (
              <>
                <Select
                  label="Complicação"
                  value={filters.complicacao}
                  onChange={(v) => update({ complicacao: v as Filters["complicacao"] })}
                  options={[{ value: "", label: "Todas" }, ...complicationOptions]}
                />
                <Select
                  label="Caixa"
                  value={filters.caixa}
                  onChange={(v) => update({ caixa: v as Filters["caixa"] })}
                  options={[{ value: "", label: "Todas" }, ...caseOptions]}
                />
              </>
            )}
            <Select
              label="Ordenar"
              value={filters.ordem}
              onChange={(v) => update({ ordem: v as Filters["ordem"] })}
              options={orderOptions}
            />
          </div>
        </div>
      </div>

      <div className="frame py-10 md:py-14">
        <p className="text-[0.9375rem] text-ink-2" role="status" aria-live="polite" data-testid="result-count">
          {countLabel(list.length, filters.tipo)}
        </p>

        {list.length === 0 ? (
          <div className="py-24 text-center" data-testid="empty-state">
            <p className="font-display text-[2rem] leading-tight">Nenhuma peça com esses filtros.</p>
            <p className="mt-3 text-ink-2">Tente outra complicação ou outro material de caixa.</p>
            <button type="button" className="btn btn-primary mt-8" onClick={clear}>
              Limpar filtros
            </button>
          </div>
        ) : (
          <ul
            className={`mt-8 grid gap-x-6 gap-y-14 transition-opacity xs:grid-cols-2 lg:grid-cols-3 ${pending ? "opacity-60" : ""}`}
          >
            {list.map((p, i) => (
              <li key={p.slug}>
                <ProductCard product={p} priority={i < 3} />
              </li>
            ))}
          </ul>
        )}

        {hasActiveFilters(filters) && list.length > 0 && (
          <button type="button" className="link mt-14 text-[0.9375rem]" onClick={clear}>
            Limpar filtros
          </button>
        )}
      </div>
    </>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="relative flex items-center gap-2 rounded-sm border border-hairline bg-rhodium-50 pl-3 text-[0.875rem] focus-within:border-blued">
      <span className="text-ink-2">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 cursor-pointer appearance-none bg-transparent pr-8 font-medium focus-visible:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-2.5" width="12" height="12" viewBox="0 0 12 12" aria-hidden>
        <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </label>
  );
}

/** Server-rendered fallback: the unfiltered watch grid, so the page has full content before hydration. */
export function CollectionFallback() {
  const list = products.filter((p) => p.kind === "watch");
  return (
    <div className="frame py-10 md:py-14">
      <ul className="mt-8 grid gap-x-6 gap-y-14 xs:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => (
          <li key={p.slug}>
            <ProductCard product={p} priority={i < 3} />
          </li>
        ))}
      </ul>
    </div>
  );
}
