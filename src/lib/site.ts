// Explicit override first, then the production domain Vercel injects at build time.
function resolveSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export const site = {
  name: "Remontoir",
  title: "Remontoir — relojoaria independente",
  description:
    "Relógios mecânicos de corda manual, montados e regulados à mão no Vallée de Joux. Boutique em São Paulo.",
  url: resolveSiteUrl(),
  locale: "pt_BR",
  author: { name: "Artur Guerra", url: "https://github.com/ehoguerra" },
};

export const nav = [
  { href: "/colecao", label: "Coleção" },
  { href: "/colecao?tipo=pulseiras", label: "Pulseiras" },
  { href: "/#calibre", label: "O calibre" },
  { href: "/#oficina", label: "Oficina" },
];
