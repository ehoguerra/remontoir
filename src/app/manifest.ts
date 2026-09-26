import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Remontoir — relojoaria independente",
    short_name: "Remontoir",
    description: "Relógios mecânicos de corda manual, montados à mão no Vallée de Joux.",
    start_url: "/",
    display: "standalone",
    background_color: "#e3e5e8",
    theme_color: "#e3e5e8",
    lang: "pt-BR",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
