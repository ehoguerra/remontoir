export const site = {
  name: "Remontoir",
  title: "Remontoir — relojoaria independente",
  description:
    "Relógios mecânicos de corda manual, montados e regulados à mão no Vallée de Joux. Boutique em São Paulo.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://remontoir.vercel.app",
  locale: "pt_BR",
  author: { name: "Artur Guerra", url: "https://arturguerra.com" },
};

export const nav = [
  { href: "/colecao", label: "Coleção" },
  { href: "/colecao?tipo=pulseiras", label: "Pulseiras" },
  { href: "/#calibre", label: "O calibre" },
  { href: "/#oficina", label: "Oficina" },
];
