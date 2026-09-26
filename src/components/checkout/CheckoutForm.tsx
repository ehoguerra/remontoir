"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { getProduct, renderPath } from "@/data/products";
import { cartSubtotal, linePrice, useCart, useCartHydrated } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import {
  EMAIL,
  UFS,
  digits,
  expiryValid,
  lookupCep,
  luhn,
  maskCard,
  maskCep,
  maskExpiry,
  maskPhone,
} from "@/lib/forms";
import { Field } from "./Field";

type Delivery = "segurada" | "boutique";
type Payment = "pix" | "cartao";

interface FormState {
  email: string;
  name: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  uf: string;
  delivery: Delivery;
  payment: Payment;
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvv: string;
  installments: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const initial: FormState = {
  email: "",
  name: "",
  phone: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  uf: "",
  delivery: "segurada",
  payment: "pix",
  cardNumber: "",
  cardName: "",
  cardExpiry: "",
  cardCvv: "",
  installments: "10",
};

const PIX_DISCOUNT = 0.05;

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (!EMAIL.test(f.email.trim())) e.email = "Digite um e-mail completo, como nome@exemplo.com.";
  if (f.name.trim().split(/\s+/).length < 2) e.name = "Digite nome e sobrenome.";
  const phone = digits(f.phone);
  if (phone.length < 10) e.phone = "Digite o celular com DDD, como (11) 91234-5678.";
  if (f.delivery === "segurada") {
    if (digits(f.cep).length !== 8) e.cep = "O CEP tem 8 números.";
    if (!f.street.trim()) e.street = "Digite a rua.";
    if (!f.number.trim()) e.number = "Digite o número, ou “s/n”.";
    if (!f.district.trim()) e.district = "Digite o bairro.";
    if (!f.city.trim()) e.city = "Digite a cidade.";
    if (!UFS.includes(f.uf)) e.uf = "Escolha o estado.";
  }
  if (f.payment === "cartao") {
    if (!luhn(f.cardNumber)) e.cardNumber = "Confira o número do cartão.";
    if (f.cardName.trim().length < 3) e.cardName = "Digite o nome como está no cartão.";
    if (!expiryValid(f.cardExpiry)) e.cardExpiry = "Use MM/AA com uma data que ainda não passou.";
    if (!/^\d{3,4}$/.test(f.cardCvv)) e.cardCvv = "O código tem 3 ou 4 números.";
  }
  return e;
}

const fieldOrder: (keyof FormState)[] = [
  "email",
  "name",
  "phone",
  "cep",
  "street",
  "number",
  "district",
  "city",
  "uf",
  "cardNumber",
  "cardName",
  "cardExpiry",
  "cardCvv",
];

export interface PlacedOrder {
  id: string;
  email: string;
  total: number;
  payment: Payment;
  delivery: Delivery;
  items: { name: string; qty: number }[];
}

export function CheckoutForm() {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const [f, setF] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [cepLookup, setCepLookup] = useState<{ cep: string; status: "ok" | "notfound" | "error" } | null>(null);
  const hydrated = useCartHydrated();
  const [placing, setPlacing] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setF((prev) => {
      const next = { ...prev, [key]: value };
      if (submitted) setErrors(validate(next));
      return next;
    });
  };

  // ViaCEP lookup once the CEP is complete
  const cepDigits = digits(f.cep);
  const cepStatus = cepDigits.length !== 8 ? "idle" : cepLookup?.cep === cepDigits ? cepLookup.status : "loading";
  useEffect(() => {
    if (cepDigits.length !== 8) return;
    const ctrl = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      ctrl.abort();
    }, 6000);
    lookupCep(cepDigits, ctrl.signal)
      .then((r) => {
        if (!r) {
          setCepLookup({ cep: cepDigits, status: "notfound" });
          return;
        }
        setF((prev) => ({
          ...prev,
          street: r.street || prev.street,
          district: r.district || prev.district,
          city: r.city || prev.city,
          uf: r.uf || prev.uf,
        }));
        setCepLookup({ cep: cepDigits, status: "ok" });
        numberRef.current?.focus();
      })
      .catch(() => {
        // aborted because the CEP changed: stay quiet; timed out or offline: say so
        if (timedOut || !ctrl.signal.aborted) setCepLookup({ cep: cepDigits, status: "error" });
      })
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [cepDigits]);

  const subtotal = cartSubtotal(lines);
  const discount = f.payment === "pix" ? Math.round(subtotal * PIX_DISCOUNT) : 0;
  const total = subtotal - discount;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate(f);
    setErrors(errs);
    const first = fieldOrder.find((k) => errs[k]);
    if (first) {
      summaryRef.current?.focus();
      return;
    }
    setPlacing(true);
    const order: PlacedOrder = {
      id: `R-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`,
      email: f.email.trim(),
      total,
      payment: f.payment,
      delivery: f.delivery,
      items: lines.map((l) => ({ name: getProduct(l.slug)?.name ?? l.slug, qty: l.qty })),
    };
    sessionStorage.setItem("remontoir-order", JSON.stringify(order));
    // a short pause reads as "processing" without pretending to talk to a server
    setTimeout(() => {
      clear();
      router.push("/checkout/confirmado");
    }, 700);
  };

  if (!hydrated) return <div className="mt-12 h-96 animate-pulse rounded-sm bg-rhodium-50/60" aria-hidden />;

  if (lines.length === 0) {
    return (
      <div className="mt-12 max-w-xl" data-testid="checkout-empty">
        <p className="font-display text-[2rem] leading-tight">Não há nada para finalizar.</p>
        <p className="mt-3 text-ink-2">Sua sacola está vazia. Escolha um relógio e volte para cá.</p>
        <Link href="/colecao" className="btn btn-primary mt-8">
          Ver a coleção
        </Link>
      </div>
    );
  }

  const errorList = fieldOrder.filter((k) => errors[k]);

  return (
    <form onSubmit={submit} noValidate className="mt-12 grid gap-12 lg:grid-cols-12" data-testid="checkout-form">
      <div className="space-y-12 lg:col-span-7">
        <div
          ref={summaryRef}
          tabIndex={-1}
          role={errorList.length ? "alert" : undefined}
          className={errorList.length ? "rounded-sm border border-ruby/40 bg-ruby/[0.04] p-5 outline-none" : "sr-only"}
          data-testid="error-summary"
        >
          {errorList.length > 0 && (
            <>
              <p className="font-semibold">
                {errorList.length === 1 ? "Falta corrigir um campo:" : `Faltam corrigir ${errorList.length} campos:`}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.9375rem]">
                {errorList.map((k) => (
                  <li key={k}>
                    <a href={`#${k}`} className="link text-ruby">
                      {errors[k]}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <fieldset>
          <legend className="font-display text-[1.75rem]">Contato</legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field
              id="email"
              label="E-mail"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={f.email}
              onChange={(e) => set("email", e.target.value)}
              error={errors.email}
              className="sm:col-span-2"
            />
            <Field
              id="name"
              label="Nome completo"
              autoComplete="name"
              value={f.name}
              onChange={(e) => set("name", e.target.value)}
              error={errors.name}
            />
            <Field
              id="phone"
              label="Celular"
              type="tel"
              autoComplete="tel-national"
              inputMode="tel"
              value={f.phone}
              onChange={(e) => set("phone", maskPhone(e.target.value))}
              error={errors.phone}
              placeholder="(11) 91234-5678"
            />
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-[1.75rem]">Entrega</legend>
          <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Forma de entrega">
            <Choice
              name="delivery"
              value="segurada"
              checked={f.delivery === "segurada"}
              onChange={() => set("delivery", "segurada")}
              title="Entrega segurada"
              text="Grátis. De 3 a 5 dias úteis, com assinatura."
            />
            <Choice
              name="delivery"
              value="boutique"
              checked={f.delivery === "boutique"}
              onChange={() => set("delivery", "boutique")}
              title="Retirar na boutique"
              text="Grátis. Rua Haddock Lobo, 1.421, São Paulo."
            />
          </div>

          {f.delivery === "segurada" && (
            <div className="mt-6 grid gap-5 sm:grid-cols-6">
              <Field
                id="cep"
                label="CEP"
                inputMode="numeric"
                autoComplete="postal-code"
                value={f.cep}
                onChange={(e) => set("cep", maskCep(e.target.value))}
                error={errors.cep}
                placeholder="00000-000"
                className="sm:col-span-2"
                hint={
                  cepStatus === "loading"
                    ? "Buscando endereço…"
                    : cepStatus === "ok"
                      ? "Endereço encontrado. Confira e complete o número."
                      : cepStatus === "notfound"
                        ? "CEP não encontrado. Confira os números ou preencha o endereço."
                        : cepStatus === "error"
                          ? "Não foi possível buscar o CEP agora. Preencha o endereço manualmente."
                          : "O endereço é preenchido a partir do CEP."
                }
              />
              <Field
                id="street"
                label="Rua"
                autoComplete="address-line1"
                value={f.street}
                onChange={(e) => set("street", e.target.value)}
                error={errors.street}
                className="sm:col-span-4"
              />
              <div className="sm:col-span-2">
                <label htmlFor="number" className="text-[0.875rem] font-medium">
                  Número
                </label>
                <input
                  ref={numberRef}
                  id="number"
                  name="number"
                  autoComplete="address-line2"
                  value={f.number}
                  onChange={(e) => set("number", e.target.value)}
                  className="field mt-1.5"
                  aria-invalid={Boolean(errors.number)}
                  aria-describedby={errors.number ? "number-error" : undefined}
                />
                {errors.number && (
                  <p id="number-error" className="mt-1.5 text-[0.8125rem] text-ruby">
                    {errors.number}
                  </p>
                )}
              </div>
              <Field
                id="complement"
                label="Complemento (opcional)"
                value={f.complement}
                onChange={(e) => set("complement", e.target.value)}
                className="sm:col-span-4"
              />
              <Field
                id="district"
                label="Bairro"
                value={f.district}
                onChange={(e) => set("district", e.target.value)}
                error={errors.district}
                className="sm:col-span-2"
              />
              <Field
                id="city"
                label="Cidade"
                autoComplete="address-level2"
                value={f.city}
                onChange={(e) => set("city", e.target.value)}
                error={errors.city}
                className="sm:col-span-3"
              />
              <div className="sm:col-span-1">
                <label htmlFor="uf" className="text-[0.875rem] font-medium">
                  UF
                </label>
                <select
                  id="uf"
                  name="uf"
                  autoComplete="address-level1"
                  value={f.uf}
                  onChange={(e) => set("uf", e.target.value)}
                  className="field mt-1.5"
                  aria-invalid={Boolean(errors.uf)}
                  aria-describedby={errors.uf ? "uf-error" : undefined}
                >
                  <option value="">—</option>
                  {UFS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                {errors.uf && (
                  <p id="uf-error" className="mt-1.5 text-[0.8125rem] text-ruby">
                    {errors.uf}
                  </p>
                )}
              </div>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className="font-display text-[1.75rem]">Pagamento</legend>
          <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Forma de pagamento">
            <Choice
              name="payment"
              value="pix"
              checked={f.payment === "pix"}
              onChange={() => set("payment", "pix")}
              title="Pix"
              text="5% de desconto. O código vale por 30 minutos."
            />
            <Choice
              name="payment"
              value="cartao"
              checked={f.payment === "cartao"}
              onChange={() => set("payment", "cartao")}
              title="Cartão de crédito"
              text="Em até 10 vezes sem juros."
            />
          </div>
          {f.payment === "cartao" && (
            <div className="mt-6 grid gap-5 sm:grid-cols-6">
              <p className="rounded-sm bg-rhodium-50 px-4 py-3 text-[0.8125rem] text-ink-2 sm:col-span-6">
                Esta loja é uma demonstração: os dados do cartão só são conferidos no seu navegador e não são enviados
                nem guardados. Para testar, use 4242 4242 4242 4242.
              </p>
              <Field
                id="cardNumber"
                label="Número do cartão"
                inputMode="numeric"
                autoComplete="cc-number"
                value={f.cardNumber}
                onChange={(e) => set("cardNumber", maskCard(e.target.value))}
                error={errors.cardNumber}
                className="sm:col-span-4"
              />
              <Field
                id="cardExpiry"
                label="Validade"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/AA"
                value={f.cardExpiry}
                onChange={(e) => set("cardExpiry", maskExpiry(e.target.value))}
                error={errors.cardExpiry}
                className="sm:col-span-2"
              />
              <Field
                id="cardName"
                label="Nome impresso no cartão"
                autoComplete="cc-name"
                value={f.cardName}
                onChange={(e) => set("cardName", e.target.value)}
                error={errors.cardName}
                className="sm:col-span-4"
              />
              <Field
                id="cardCvv"
                label="Código de segurança"
                inputMode="numeric"
                autoComplete="cc-csc"
                value={f.cardCvv}
                onChange={(e) => set("cardCvv", digits(e.target.value).slice(0, 4))}
                error={errors.cardCvv}
                className="sm:col-span-2"
              />
              <div className="sm:col-span-3">
                <label htmlFor="installments" className="text-[0.875rem] font-medium">
                  Parcelas
                </label>
                <select
                  id="installments"
                  value={f.installments}
                  onChange={(e) => set("installments", e.target.value)}
                  className="field mt-1.5"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}x de {formatPrice(Math.ceil(total / n))} sem juros
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </fieldset>
      </div>

      <aside className="lg:col-span-4 lg:col-start-9" aria-label="Resumo do pedido">
        <div className="rounded-sm bg-rhodium-50 p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-[1.6rem]">Seu pedido</h2>
          <ul className="mt-5 space-y-4">
            {lines.map((l) => {
              const p = getProduct(l.slug);
              if (!p) return null;
              return (
                <li key={l.key} className="flex items-center gap-3">
                  <div className="plinth relative h-16 w-16 shrink-0 overflow-hidden rounded-sm">
                    <Image src={renderPath(p.slug)} alt="" fill sizes="64px" className="scale-[1.4] object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 text-[0.9375rem]">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-[0.8125rem] text-ink-2">
                      Qtd. {l.qty}
                      {l.engraving ? ", com gravação" : ""}
                    </p>
                  </div>
                  <p className="numeric text-[0.9375rem]">{formatPrice(linePrice(l) * l.qty)}</p>
                </li>
              );
            })}
          </ul>
          <dl className="numeric mt-6 space-y-3 border-t border-hairline pt-5 text-[0.9375rem]">
            <div className="flex justify-between">
              <dt className="text-ink-2">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-blued">
                <dt>Desconto Pix (5%)</dt>
                <dd>− {formatPrice(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-2">Entrega</dt>
              <dd>Grátis</dd>
            </div>
            <div className="flex justify-between border-t border-hairline pt-3 text-[1.125rem] font-semibold">
              <dt>Total</dt>
              <dd data-testid="checkout-total">{formatPrice(total)}</dd>
            </div>
          </dl>
          <button type="submit" className="btn btn-primary mt-6 w-full" disabled={placing} data-testid="place-order">
            {placing ? "Finalizando…" : "Finalizar pedido"}
          </button>
          <p className="mt-3 text-center text-[0.8125rem] text-ink-2">
            Loja de demonstração. Nenhuma cobrança é feita.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Choice({
  name,
  value,
  checked,
  onChange,
  title,
  text,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  text: string;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-sm border border-hairline bg-rhodium-50/60 p-4 transition-colors hover:border-ink/40 has-[:checked]:border-ink has-[:checked]:bg-rhodium-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blued">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 accent-ink"
      />
      <span>
        <span className="block text-[0.9375rem] font-semibold">{title}</span>
        <span className="mt-0.5 block text-[0.8125rem] text-ink-2">{text}</span>
      </span>
    </label>
  );
}
