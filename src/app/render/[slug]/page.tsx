import { notFound } from "next/navigation";
import type { Metadata } from "next";
import RenderClient from "./RenderClient";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Dev-only stage used by scripts/render-products.mjs to photograph each product. */
export default async function RenderPage(props: PageProps<"/render/[slug]">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { slug } = await props.params;
  const { view } = await props.searchParams;
  const v = view === "back" || view === "night" || view === "hero" ? view : "front";
  return <RenderClient slug={slug} view={v} />;
}
