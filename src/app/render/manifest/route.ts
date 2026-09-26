import { heroWatch, products } from "@/data/products";

/** Dev-only list of images the render pipeline should produce. */
export function GET() {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const jobs = products.flatMap((p) => {
    if (p.kind === "strap") return [{ slug: p.slug, view: "front" }];
    const views = ["front", "back"];
    if (p.model.lume) views.push("night");
    if (p.slug === heroWatch.slug) views.push("hero");
    return views.map((view) => ({ slug: p.slug, view }));
  });
  return Response.json(jobs);
}
