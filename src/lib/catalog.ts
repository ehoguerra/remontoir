import { products } from "@/data/products";
import type { CaseMaterial, Complication, Product } from "@/data/types";

export type Tipo = "todos" | "relogios" | "pulseiras";
export type Ordem = "destaque" | "menor-preco" | "maior-preco";

export interface Filters {
  tipo: Tipo;
  complicacao: Complication | "";
  caixa: CaseMaterial | "";
  ordem: Ordem;
}

export const complicationOptions: { value: Complication; label: string }[] = [
  { value: "time", label: "Hora e segundos" },
  { value: "small-seconds", label: "Pequenos segundos" },
  { value: "moonphase", label: "Fase da lua" },
  { value: "chronograph", label: "Cronógrafo" },
  { value: "gmt", label: "GMT" },
  { value: "regulator", label: "Regulador" },
];

export const caseOptions: { value: CaseMaterial; label: string }[] = [
  { value: "steel", label: "Aço" },
  { value: "titanium", label: "Titânio" },
  { value: "rose-gold", label: "Ouro rosé" },
  { value: "yellow-gold", label: "Ouro amarelo" },
];

export const orderOptions: { value: Ordem; label: string }[] = [
  { value: "destaque", label: "Destaques" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
];

const oneOf = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

export function parseFilters(params: URLSearchParams): Filters {
  return {
    tipo: oneOf(params.get("tipo"), ["todos", "relogios", "pulseiras"] as const, "relogios"),
    complicacao: oneOf<Filters["complicacao"]>(
      params.get("complicacao"),
      ["", ...complicationOptions.map((o) => o.value)],
      "",
    ),
    caixa: oneOf<Filters["caixa"]>(params.get("caixa"), ["", ...caseOptions.map((o) => o.value)], ""),
    ordem: oneOf(params.get("ordem"), ["destaque", "menor-preco", "maior-preco"] as const, "destaque"),
  };
}

export function applyFilters(f: Filters, list: Product[] = products): Product[] {
  const filtered = list.filter((p) => {
    if (f.tipo === "relogios" && p.kind !== "watch") return false;
    if (f.tipo === "pulseiras" && p.kind !== "strap") return false;
    if (p.kind === "watch") {
      if (f.complicacao && p.model.complication !== f.complicacao) return false;
      if (f.caixa && p.model.caseMaterial !== f.caixa) return false;
    } else if (f.complicacao || f.caixa) {
      return false;
    }
    return true;
  });
  if (f.ordem === "menor-preco") return [...filtered].sort((a, b) => a.price - b.price);
  if (f.ordem === "maior-preco") return [...filtered].sort((a, b) => b.price - a.price);
  return filtered;
}

export const hasActiveFilters = (f: Filters) => Boolean(f.complicacao || f.caixa || f.ordem !== "destaque");
