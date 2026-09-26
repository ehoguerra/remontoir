"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { heroWatch } from "@/data/products";
import { formatPrice } from "@/lib/format";
import { useLive3d, useMediaQuery } from "@/lib/hooks";

const HeroCanvas = dynamic(() => import("@/components/three/HeroCanvas"), { ssr: false });

/**
 * The hero: a sticky stage where the Lune 39 tells the visitor's time. Scrolling through the
 * section turns the watch over to show the calibre. A pre-rendered poster (at 10:10) paints first;
 * the live 3D fades in over it once the page is idle.
 */
export function Hero() {
  const section = useRef<HTMLElement>(null);
  const panelA = useRef<HTMLDivElement>(null);
  const panelB = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  // the poster is the LCP element; the live watch waits for load + idle
  const mount3d = useLive3d();
  const [ready, setReady] = useState(false);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const p = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
      progress.current = p;
      el.style.setProperty("--p", p.toFixed(4));
      if (panelA.current) panelA.current.inert = p > 0.3;
      if (panelB.current) panelB.current.inert = p < 0.6;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // A plain #calibre jump works before hydration; once hydrated, glide there instead.
  const scrollToCalibre = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = section.current;
    if (!el) return;
    e.preventDefault();
    const top = el.offsetTop + (el.offsetHeight - window.innerHeight) * 0.82;
    window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <section
      ref={section}
      aria-labelledby="hero-title"
      className="relative h-[250svh] md:h-[260svh]"
      style={{ ["--p" as string]: 0 }}
      data-testid="hero"
    >
      {/* in-page target for "O calibre": lands where the watch has turned over */}
      <div id="calibre" className="absolute left-0 h-px w-px" style={{ top: "50%" }} aria-hidden />
      <div className="sunray hero-sun sticky top-0 h-svh overflow-hidden">
        {/* Poster: the same watch, rendered at 10:10 */}
        <div
          className="hero-poster pointer-events-none absolute transition-opacity duration-700"
          style={{ opacity: ready ? 0 : 1 }}
          aria-hidden
        >
          <Image
            src="/renders/lune-39-hero.webp"
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="(min-width: 768px) 75vh, 110vw"
            className="object-contain"
          />
        </div>

        {mount3d && (
          <div
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: ready ? 1 : 0 }}
            data-testid="hero-canvas"
            data-ready={ready}
          >
            <HeroCanvas progress={progress} reducedMotion={reducedMotion} onReady={() => setReady(true)} />
          </div>
        )}

        <div className="hero-fade pointer-events-none absolute inset-x-0 bottom-0 h-[58%]" aria-hidden />

        <div className="frame pointer-events-none relative h-full">
          {/* Panel A: the promise */}
          <div
            ref={panelA}
            className="hero-panel-a pointer-events-auto absolute inset-x-4 bottom-0 pb-10 md:inset-x-auto md:bottom-auto md:top-1/2 md:w-[min(37rem,45vw)] md:-translate-y-1/2 md:pb-0"
          >
            <h1 id="hero-title" className="display-hero animate-[rise-in_900ms_var(--ease-watch)_both]">
              Cento e doze horas para marcar um segundo.
            </h1>
            <p className="lede mt-6 animate-[rise-in_900ms_120ms_var(--ease-watch)_both]">
              Relógios mecânicos de corda manual, montados e regulados à mão por quatro relojoeiros no Vallée de Joux. O{" "}
              {heroWatch.name} ao lado mostra a sua hora e a lua de hoje.
            </p>
            <div className="mt-9 flex flex-wrap gap-3 animate-[rise-in_900ms_220ms_var(--ease-watch)_both]">
              <Link href="/colecao" className="btn btn-primary">
                Ver a coleção
              </Link>
              <a href="#calibre" onClick={scrollToCalibre} className="btn btn-quiet">
                Ver o calibre
              </a>
            </div>
          </div>

          {/* Caption for the watch on stage */}
          <p className="hero-caption pointer-events-auto absolute right-0 bottom-10 hidden text-right text-[0.875rem] leading-snug text-ink-2 md:block">
            <Link href={`/colecao/${heroWatch.slug}`} className="font-display text-[1.25rem] text-ink hover:text-blued">
              {heroWatch.name}
            </Link>
            <br />
            Aço, 39 mm, fase da lua
            <br />
            <span className="numeric">{formatPrice(heroWatch.price)}</span>
          </p>

          {/* Panel B: the calibre, seen through the caseback */}
          {/* inert from the server: until the scroll script runs, this invisible panel must not eat taps */}
          <div
            ref={panelB}
            inert
            data-testid="hero-calibre"
            className="hero-panel-b pointer-events-auto absolute inset-x-4 bottom-0 pb-10 md:inset-x-auto md:bottom-auto md:top-1/2 md:w-[min(32rem,42vw)] md:-translate-y-1/2 md:pb-0"
          >
            <h2 className="display-l">Calibre R.03, visto pelo fundo.</h2>
            <p className="lede mt-5 hidden md:block">
              As pontes são chanfradas e polidas à mão, as Côtes de Genève riscadas uma a uma e os parafusos azulados a
              fogo. Tudo isso fica à vista pelo fundo de safira.
            </p>
            <dl className="numeric mt-8 grid max-w-md grid-cols-2 gap-x-8 gap-y-4 border-t border-hairline pt-6 text-[0.9375rem]">
              <div>
                <dt className="text-ink-2">Reserva de marcha</dt>
                <dd className="mt-0.5 font-display text-[1.6rem] leading-tight">72 horas</dd>
              </div>
              <div>
                <dt className="text-ink-2">Frequência</dt>
                <dd className="mt-0.5 font-display text-[1.6rem] leading-tight">4 Hz</dd>
              </div>
              <div>
                <dt className="text-ink-2">Rubis</dt>
                <dd className="mt-0.5 font-display text-[1.6rem] leading-tight">23</dd>
              </div>
              <div>
                <dt className="text-ink-2">Componentes</dt>
                <dd className="mt-0.5 font-display text-[1.6rem] leading-tight">164</dd>
              </div>
            </dl>
            <Link href={`/colecao/${heroWatch.slug}`} className="btn btn-primary mt-9">
              Conhecer o {heroWatch.name}
            </Link>
          </div>
        </div>

        <div
          className="hero-hint pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center md:flex"
          aria-hidden
        >
          <span className="flex flex-col items-center gap-2 text-[0.8125rem] text-ink-2">
            Role para virar o relógio
            <span className="hero-hint-line" />
          </span>
        </div>
      </div>
    </section>
  );
}
