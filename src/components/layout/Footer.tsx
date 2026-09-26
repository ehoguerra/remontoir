import Link from "next/link";
import { Mark } from "@/components/ui/icons";
import { site } from "@/lib/site";

const columns = [
  {
    title: "Coleção",
    links: [
      { href: "/colecao?tipo=relogios", label: "Todos os relógios" },
      { href: "/colecao?complicacao=moonphase", label: "Fase da lua" },
      { href: "/colecao?complicacao=chronograph", label: "Cronógrafo" },
      { href: "/colecao?tipo=pulseiras", label: "Pulseiras" },
    ],
  },
  {
    title: "A casa",
    links: [
      { href: "/#calibre", label: "O calibre R.01" },
      { href: "/#oficina", label: "Como um Remontoir é feito" },
      { href: "/#servico", label: "Garantia e revisão" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-night text-rhodium-200">
      <div className="frame grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <Link href="/" className="inline-flex items-center gap-2.5 text-rhodium-50">
            <Mark />
            <span className="font-display text-[1.6rem] leading-none">Remontoir</span>
          </Link>
          <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-rhodium-200/80">
            Relógios mecânicos de corda manual, feitos por quatro relojoeiros em Le Sentier, no Vallée de Joux.
          </p>
          <address className="mt-8 text-[0.9375rem] not-italic leading-relaxed text-rhodium-200/80">
            Boutique São Paulo
            <br />
            Rua Haddock Lobo, 1.421, Jardins
            <br />
            Segunda a sábado, das 10h às 19h
          </address>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="md:col-span-3">
            <h2 className="font-sans text-[0.8125rem] font-semibold text-lume/80">{col.title}</h2>
            <ul className="mt-4 space-y-2.5 text-[0.9375rem]">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-rhodium-200/85 transition-colors hover:text-rhodium-50">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="frame flex flex-col gap-2 py-6 text-[0.8125rem] text-rhodium-200/65 md:flex-row md:justify-between">
          <p>© 2026 Remontoir. Marca e loja fictícias, criadas como projeto de portfólio.</p>
          <p>
            Design e desenvolvimento:{" "}
            <a href={site.author.url} className="link text-rhodium-200/90" rel="author">
              {site.author.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
