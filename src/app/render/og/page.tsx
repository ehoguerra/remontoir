import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Dev-only 1200×630 card, photographed by scripts/render-products.mjs into the Open Graph image. */
export default function OgCard() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div
      id="og"
      className="sunray relative flex h-[630px] w-[1200px] items-center overflow-hidden"
      style={{ ["--sun-x" as string]: "74%", ["--sun-y" as string]: "50%" }}
    >
      <div className="relative z-10 w-[640px] pl-20">
        <p className="font-display text-[34px] leading-none">Remontoir</p>
        <p className="mt-10 font-display text-[76px] leading-[0.98] tracking-[-0.02em]">
          Cento e doze horas para marcar um segundo.
        </p>
        <p className="mt-8 text-[22px] text-ink-2">Relojoaria independente. Vallée de Joux e São Paulo.</p>
      </div>
      <div className="absolute top-1/2 right-[-40px] h-[760px] w-[760px] -translate-y-1/2">
        <Image src="/renders/lune-39-hero.webp" alt="" fill priority sizes="760px" className="object-contain" />
      </div>
    </div>
  );
}
