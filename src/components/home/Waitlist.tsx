"use client";

import { useState, type FormEvent } from "react";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Frontend-only waitlist form: validates, confirms, and keeps nothing. */
export function Waitlist() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError("Digite um e-mail completo, como nome@exemplo.com.");
      return;
    }
    setError("");
    setDone(true);
  };

  return (
    <section
      aria-labelledby="waitlist-title"
      className="sunray"
      style={{ ["--sun-x" as string]: "86%", ["--sun-y" as string]: "30%" }}
    >
      <div className="frame grid gap-10 py-24 md:grid-cols-12 md:py-32">
        <div className="md:col-span-6">
          <h2 id="waitlist-title" className="display-l">
            Séries limitadas saem primeiro para a lista.
          </h2>
          <p className="lede mt-5">Duas ou três vezes por ano, com uma semana de antecedência. Sem outros e-mails.</p>
        </div>
        <div className="md:col-span-5 md:col-start-8 md:self-end">
          {done ? (
            <p role="status" className="border-t border-ink pt-5 text-[1.0625rem]" data-testid="waitlist-done">
              Pronto. Avisaremos <strong className="font-semibold">{email.trim()}</strong> antes do próximo lançamento.
            </p>
          ) : (
            <form onSubmit={submit} noValidate className="border-t border-ink pt-5">
              <label htmlFor="waitlist-email" className="text-[0.9375rem] font-medium">
                Seu e-mail
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <input
                  id="waitlist-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "waitlist-error" : undefined}
                  className="field flex-1"
                  placeholder="nome@exemplo.com"
                />
                <button type="submit" className="btn btn-primary">
                  Entrar na lista
                </button>
              </div>
              {error && (
                <p id="waitlist-error" className="mt-2 text-[0.875rem] text-ruby">
                  {error}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
