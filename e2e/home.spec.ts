import { expect, test } from "@playwright/test";
import { trackErrors } from "./helpers";

test.describe("Home", () => {
  test("hero paints the poster, then the live 3D watch takes over", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cento e doze horas para marcar um segundo.");
    await expect(page.locator('img[src*="lune-39-hero"]')).toBeVisible();
    await expect(page.getByTestId("hero-canvas")).toHaveAttribute("data-ready", "true", { timeout: 30_000 });
    await expect(page.locator('[data-testid="hero-canvas"] canvas')).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test("scrolling through the hero turns the watch over to the calibre", async ({ page }) => {
    await page.goto("/");
    const calibre = page.getByTestId("hero-calibre");
    await expect(calibre).toHaveCSS("opacity", "0");
    await page.getByRole("link", { name: "Ver o calibre" }).click();
    await expect.poll(async () => Number(await calibre.evaluate((el) => getComputedStyle(el).opacity))).toBeGreaterThan(0.9);
    await expect(calibre.getByRole("heading", { name: "Calibre R.03, visto pelo fundo." })).toBeVisible();
  });

  test("shows the featured pieces and the 112-hour breakdown", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("featured-item")).toHaveCount(3);
    await expect(page.getByRole("heading", { name: "Régulateur 39" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Para onde vão as 112 horas." })).toBeVisible();
    await expect(page.getByRole("img", { name: /Distribuição das 112 horas/ })).toBeVisible();
  });

  test("the Nocturne band switches between daylight and darkness", async ({ page }) => {
    await page.goto("/");
    const dark = page.getByRole("radio", { name: "No escuro" });
    const day = page.getByRole("radio", { name: "De dia" });
    await dark.scrollIntoViewIfNeeded();
    await expect(dark).toHaveAttribute("aria-checked", "true");
    await day.click();
    await expect(day).toHaveAttribute("aria-checked", "true");
    await expect(page.getByAltText("Nocturne 40 à luz do dia")).toHaveCSS("opacity", "1");
  });

  test("waitlist explains a bad e-mail and confirms a good one", async ({ page }) => {
    await page.goto("/");
    const input = page.getByLabel("Seu e-mail");
    await input.scrollIntoViewIfNeeded();
    await input.fill("artur@");
    await page.getByRole("button", { name: "Entrar na lista" }).click();
    await expect(page.getByText("Digite um e-mail completo, como nome@exemplo.com.")).toBeVisible();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await input.fill("artur@exemplo.com");
    await page.getByRole("button", { name: "Entrar na lista" }).click();
    await expect(page.getByTestId("waitlist-done")).toContainText("artur@exemplo.com");
  });
});

test.describe("Home before hydration", () => {
  test.use({ javaScriptEnabled: false });

  test("the hero calls to action are the element under the finger", async ({ page }) => {
    await page.goto("/");
    for (const name of ["Ver a coleção", "Ver o calibre"]) {
      const hit = await page.getByRole("link", { name }).evaluate((a) => {
        const r = a.getBoundingClientRect();
        return a.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
      });
      expect(hit, `${name} is covered by another layer`).toBe(true);
    }
  });
});
