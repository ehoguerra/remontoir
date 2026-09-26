"use client";

import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { strapById, strapChoices } from "@/data/products";
import type { Product } from "@/data/types";
import { ENGRAVING_PRICE, useCart } from "@/lib/cart";
import { formatPrice, installments } from "@/lib/format";
import { useAnnouncer } from "@/lib/announce";
import type { ViewerView } from "@/components/three/ProductCanvas";
import { ProductViewer } from "./ProductViewer";

const ENGRAVING_MAX = 24;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Viewer and purchase panel share state: the strap and engraving chosen here appear on the 3D model. */
export function ProductExperience({ product, details }: { product: Product; details: ReactNode }) {
  const isWatch = product.kind === "watch";
  const [view, setView] = useState<ViewerView>("front");
  const [strapId, setStrapId] = useState(isWatch ? product.model.strapId : undefined);
  const [engrave, setEngrave] = useState(false);
  const [engraving, setEngraving] = useState("");
  const [debounced, setDebounced] = useState("");
  const add = useCart((s) => s.add);
  const say = useAnnouncer((s) => s.say);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(engrave ? engraving : ""), 160);
    return () => clearTimeout(t);
  }, [engraving, engrave]);

  const strapOptions = isWatch ? Array.from(new Set([product.model.strapId, ...strapChoices])).map(strapById) : [];
  const price = product.price + (engrave && engraving.trim() ? ENGRAVING_PRICE : 0);
  const engravingInvalid = engrave && engraving.trim().length === 0;

  const addToBag = () => {
    if (engravingInvalid) return;
    add({ slug: product.slug, strapId, engraving: engrave ? engraving.trim() : undefined });
    say(`${product.name} adicionado à sacola`);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-7">
        <div className="lg:sticky lg:top-24">
          <ProductViewer product={product} strapId={strapId} engraving={debounced} view={view} onViewChange={setView} />
        </div>
      </div>

      <div className="lg:col-span-5">
        <h1 className="display-l">{product.name}</h1>
        <p className="lede mt-3">{product.tagline}</p>
        {product.kind === "watch" && product.edition && (
          <p className="mt-4 text-[0.9375rem] font-medium text-ruby">{product.edition}</p>
        )}

        <div className="mt-7 border-t border-hairline pt-6">
          <p className="numeric text-[1.75rem] font-medium leading-none" data-testid="price">
            {formatPrice(price)}
          </p>
          <p className="mt-2 text-[0.875rem] text-ink-2">{installments(price)}</p>
        </div>

        {isWatch && (
          <fieldset className="mt-8">
            <legend className="text-[0.9375rem] font-semibold">Pulseira</legend>
            <p className="mt-1 text-[0.8125rem] text-ink-2">
              Todas incluídas no preço. A escolhida aparece no relógio.
            </p>
            <div className="mt-3 grid gap-2">
              {strapOptions.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-3 rounded-sm border border-hairline bg-rhodium-50/60 px-3 py-2.5 transition-colors hover:border-ink/40 has-[:checked]:border-ink has-[:checked]:bg-rhodium-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blued"
                >
                  <input
                    type="radio"
                    name="strap"
                    value={s.id}
                    checked={strapId === s.id}
                    onChange={() => {
                      setStrapId(s.id);
                      if (view === "back") setView("front");
                    }}
                    className="sr-only"
                  />
                  <span
                    className="h-6 w-6 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]"
                    style={{ background: s.color }}
                    aria-hidden
                  />
                  <span className="text-[0.9375rem]">{s.name}</span>
                  {s.id === product.model.strapId && (
                    <span className="ml-auto text-[0.8125rem] text-ink-2">Original</span>
                  )}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {isWatch && (
          <div className="mt-8">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={engrave}
                onChange={(e) => {
                  setEngrave(e.target.checked);
                  if (e.target.checked) setView("back");
                }}
                className="mt-1 h-4 w-4 accent-ink"
              />
              <span>
                <span className="text-[0.9375rem] font-semibold">Gravação no fundo</span>
                <span className="numeric ml-2 text-[0.875rem] text-ink-2">+ {formatPrice(ENGRAVING_PRICE)}</span>
                <span className="block text-[0.8125rem] text-ink-2">
                  Gravada à mão no anel do fundo, até {ENGRAVING_MAX} caracteres.
                </span>
              </span>
            </label>
            {engrave && (
              <EngravingField
                value={engraving}
                onChange={setEngraving}
                onFocus={() => setView("back")}
                invalid={engravingInvalid}
              />
            )}
          </div>
        )}

        <div className="mt-9">
          {product.availability === "waitlist" ? (
            <WaitlistForm productName={product.name} />
          ) : (
            <button
              type="button"
              onClick={addToBag}
              className="btn btn-primary w-full"
              disabled={engravingInvalid}
              data-testid="add-to-bag"
            >
              {product.availability === "made-to-order" ? "Encomendar" : "Adicionar à sacola"}
            </button>
          )}
          <p className="mt-3 text-[0.875rem] text-ink-2">{product.leadTime}</p>
        </div>

        <ul className="mt-8 space-y-2 border-t border-hairline pt-6 text-[0.875rem] text-ink-2">
          <li>Entrega segurada e sem custo para todo o Brasil.</li>
          <li>Troca ou devolução em até 30 dias.</li>
          {isWatch && <li>Garantia de cinco anos e revisão na boutique de São Paulo.</li>}
        </ul>

        <div className="mt-12">{details}</div>
      </div>
    </div>
  );
}

function EngravingField({
  value,
  onChange,
  onFocus,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  onFocus: () => void;
  invalid: boolean;
}) {
  const id = useId();
  return (
    <div className="mt-3 pl-7">
      <label htmlFor={id} className="text-[0.875rem] font-medium">
        Texto da gravação
      </label>
      <input
        id={id}
        value={value}
        maxLength={ENGRAVING_MAX}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value.replace(/[^\p{L}\p{N} .,&'-]/gu, ""))}
        className="field mt-1.5 uppercase"
        placeholder="Ex.: PARA JOÃO, 2026"
        aria-invalid={invalid}
        aria-describedby={`${id}-hint`}
        autoComplete="off"
        data-testid="engraving-input"
      />
      <p id={`${id}-hint`} className={`mt-1.5 text-[0.8125rem] ${invalid ? "text-ruby" : "text-ink-2"}`}>
        {invalid
          ? "Escreva o texto da gravação ou desmarque a opção."
          : `${value.length} de ${ENGRAVING_MAX} caracteres. A prévia aparece no fundo do relógio.`}
      </p>
    </div>
  );
}

function WaitlistForm({ productName }: { productName: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const id = useId();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError("Digite um e-mail completo, como nome@exemplo.com.");
      return;
    }
    setError("");
    setDone(true);
  };
  if (done)
    return (
      <p role="status" className="rounded-sm bg-rhodium-50 px-4 py-4 text-[0.9375rem]">
        Você está na lista do {productName}. Reservamos um relógio para você quando o lote chegar.
      </p>
    );
  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={id} className="text-[0.9375rem] font-semibold">
        Reservar no próximo lote
      </label>
      <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
        <input
          id={id}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field flex-1"
          placeholder="nome@exemplo.com"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button type="submit" className="btn btn-primary">
          Entrar na lista de espera
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-[0.875rem] text-ruby">
          {error}
        </p>
      )}
    </form>
  );
}
