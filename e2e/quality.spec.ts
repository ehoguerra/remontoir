import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { scrollThrough } from "./helpers";

const pages = ["/", "/colecao", "/colecao/lune-39", "/colecao/pulseira-bezerro-conhaque", "/sacola", "/checkout"];

test.describe("Quality floor", () => {
  for (const path of pages) {
    test(`${path} has one h1, a title, a description and alt text on every image`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page).toHaveTitle(/Remontoir/);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{40,}/);
      const missingAlt = await page.locator("img:not([alt])").count();
      expect(missingAlt).toBe(0);
    });

    test(`${path} has no serious accessibility violations`, async ({ page }) => {
      await page.goto(path);
      await scrollThrough(page);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }

  test("unknown routes answer 404 with a way back", async ({ page }) => {
    const res = await page.goto("/relogio-que-nao-existe");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Esta página parou às 4h04.");
    await expect(page.getByRole("link", { name: "Ver a coleção" })).toBeVisible();
  });

  test("robots and sitemap are served, and the render stage is closed in production", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(await robots.text()).toContain("Sitemap:");
    const sitemap = await request.get("/sitemap.xml");
    expect(await sitemap.text()).toContain("/colecao/lune-39");
    const render = await request.get("/render/lune-39");
    expect(render.status()).toBe(404);
  });

  test("the skip link jumps to the content", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard navigation is a desktop concern");
    await page.goto("/colecao");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Pular para o conteúdo" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#conteudo$/);
  });
});
