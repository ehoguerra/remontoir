import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartHydrator } from "@/components/cart/CartHydrator";

export const metadata: Metadata = { title: "Página não encontrada" };

/** A dial stopped at 4:04. */
function StoppedDial() {
  const tick = (i: number) => {
    const a = (i / 60) * Math.PI * 2;
    const major = i % 5 === 0;
    const r0 = major ? 80 : 86;
    return (
      <line
        key={i}
        x1={100 + Math.sin(a) * r0}
        y1={100 - Math.cos(a) * r0}
        x2={100 + Math.sin(a) * 92}
        y2={100 - Math.cos(a) * 92}
        stroke="currentColor"
        strokeWidth={major ? 2.2 : 0.8}
      />
    );
  };
  const hour = ((4 + 4 / 60) / 12) * 360;
  const minute = (4 / 60) * 360;
  return (
    <svg
      viewBox="0 0 200 200"
      className="h-auto w-full max-w-sm text-ink"
      role="img"
      aria-label="Um mostrador parado às 4h04"
    >
      <circle cx="100" cy="100" r="98" fill="var(--color-rhodium-50)" stroke="currentColor" strokeWidth="1.2" />
      {Array.from({ length: 60 }, (_, i) => tick(i))}
      <g transform={`rotate(${hour} 100 100)`}>
        <path d="M100 100 L96 94 L100 52 L104 94 Z" fill="currentColor" />
      </g>
      <g transform={`rotate(${minute} 100 100)`}>
        <path d="M100 100 L97.5 94 L100 24 L102.5 94 Z" fill="currentColor" />
      </g>
      <circle cx="100" cy="100" r="3.2" fill="var(--color-ruby)" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="conteudo" className="frame grid items-center gap-12 pt-32 pb-24 md:grid-cols-12 md:pt-40 md:pb-32">
        <div className="md:col-span-6">
          <p className="numeric text-[0.9375rem] text-ink-2">Erro 404</p>
          <h1 className="display-xl mt-3">Esta página parou às 4h04.</h1>
          <p className="lede mt-6">
            O endereço pode ter mudado, ou o relógio que você procura saiu da coleção. As peças atuais estão todas na
            coleção.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/colecao" className="btn btn-primary">
              Ver a coleção
            </Link>
            <Link href="/" className="btn btn-quiet">
              Voltar ao início
            </Link>
          </div>
        </div>
        <div className="flex justify-center md:col-span-5 md:col-start-8">
          <StoppedDial />
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <CartHydrator />
    </>
  );
}
