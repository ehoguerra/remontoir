"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { nav } from "@/lib/site";
import { cartCount, useCart } from "@/lib/cart";
import { BagIcon, CloseIcon, Mark, MenuIcon } from "@/components/ui/icons";

export function Header() {
  const pathname = usePathname();
  const overHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const count = useCart((s) => cartCount(s.lines));
  const setOpen = useCart((s) => s.setOpen);
  const menuRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    menuRef.current?.close();
  }, [pathname]);

  const solid = !overHero || scrolled;

  return (
    <header
      data-solid={solid}
      className="fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300 data-[solid=true]:bg-rhodium/85 data-[solid=true]:shadow-[0_1px_0_var(--color-hairline)] data-[solid=true]:backdrop-blur-md"
    >
      <div className="frame flex h-16 items-center gap-8 md:h-[4.5rem]">
        <Link href="/" className="flex items-center gap-2.5 rounded-sm" aria-label="Remontoir, página inicial">
          <Mark className="text-ink" />
          <span className="font-display text-[1.45rem] leading-none tracking-[0.01em]">Remontoir</span>
        </Link>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-7 text-[0.9375rem] text-ink-2">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="py-2 transition-colors hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative flex h-11 items-center gap-2 rounded-sm px-2.5 text-[0.9375rem] transition-colors hover:text-blued"
            aria-label={count ? `Abrir sacola, ${count} ${count === 1 ? "item" : "itens"}` : "Abrir sacola, vazia"}
            data-testid="bag-button"
          >
            <BagIcon />
            <span className="hidden sm:inline">Sacola</span>
            {count > 0 && (
              <span
                className="numeric grid h-5 min-w-5 place-items-center rounded-full bg-ruby px-1 text-[0.72rem] font-semibold text-white"
                data-testid="bag-count"
              >
                {count}
              </span>
            )}
          </button>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-sm md:hidden"
            aria-label="Abrir menu"
            aria-haspopup="dialog"
            onClick={() => menuRef.current?.showModal()}
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      <dialog
        ref={menuRef}
        aria-label="Menu"
        className="m-0 h-dvh max-h-none w-full max-w-none bg-rhodium p-0 text-ink backdrop:bg-transparent open:animate-[menu-in_240ms_var(--ease-watch)]"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="frame flex h-16 items-center justify-between">
          <span className="font-display text-[1.45rem]">Remontoir</span>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center"
            aria-label="Fechar menu"
            onClick={() => menuRef.current?.close()}
          >
            <CloseIcon />
          </button>
        </div>
        <nav aria-label="Menu móvel" className="frame pt-10">
          <ul className="space-y-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block border-b border-hairline py-4 font-display text-[2rem] leading-tight"
                  onClick={() => menuRef.current?.close()}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-[0.9375rem] text-ink-2">
            Boutique São Paulo: Rua Haddock Lobo, 1.421
            <br />
            Seg. a sáb., das 10h às 19h
          </p>
        </nav>
      </dialog>
    </header>
  );
}
