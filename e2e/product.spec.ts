import { expect, test } from "@playwright/test";
import { trackErrors } from "./helpers";

test.describe("Product page", () => {
  test("shows price, structured data and a live 3D viewer", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/colecao/lune-39");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lune 39");
    await expect(page.getByTestId("price")).toHaveText("R$ 58.400");
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    const data = JSON.parse(ld ?? "{}");
    expect(data["@type"]).toBe("Product");
    expect(data.offers.price).toBe(58400);
    expect(data.offers.priceCurrency).toBe("BRL");
    await expect(page.getByTestId("viewer")).toHaveAttribute("data-ready", "true", { timeout: 30_000 });
    await page.getByRole("radio", { name: "Fundo" }).click();
    await expect(page.getByRole("radio", { name: "Fundo" })).toHaveAttribute("aria-checked", "true");
    expect(errors).toEqual([]);
  });

  test("the chosen strap goes into the bag", async ({ page }) => {
    await page.goto("/colecao/lune-39");
    await page.getByText("Bezerro conhaque", { exact: true }).click();
    await page.getByTestId("add-to-bag").click();
    const drawer = page.getByTestId("bag-drawer");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByTestId("bag-line")).toContainText("Pulseira:Bezerro conhaque");
    await expect(page.getByTestId("bag-count")).toHaveText("1");
  });

  test("engraving needs text, adds R$ 800 and is kept on the line", async ({ page }) => {
    await page.goto("/colecao/vallee-38");
    await page.getByLabel(/Gravação no fundo/).check();
    await expect(page.getByTestId("add-to-bag")).toBeDisabled();
    await expect(page.getByText("Escreva o texto da gravação ou desmarque a opção.")).toBeVisible();
    await page.getByTestId("engraving-input").fill("Para Ana, 2026");
    await expect(page.getByTestId("price")).toHaveText("R$ 37.700");
    await page.getByTestId("add-to-bag").click();
    await expect(page.getByTestId("bag-line")).toContainText("Para Ana, 2026");
    await expect(page.getByTestId("bag-subtotal")).toHaveText("R$ 37.700");
  });

  test("a sold-out watch offers the waiting list instead of the bag", async ({ page }) => {
    await page.goto("/colecao/petite-seconde-36");
    await expect(page.getByTestId("add-to-bag")).toHaveCount(0);
    await page.getByLabel("Reservar no próximo lote").fill("ana@exemplo.com");
    await page.getByRole("button", { name: "Entrar na lista de espera" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Você está na lista" })).toBeVisible();
  });

  test("made-to-order pieces are ordered, not bought off the shelf", async ({ page }) => {
    await page.goto("/colecao/regulateur-39");
    await expect(page.getByTestId("add-to-bag")).toHaveText("Encomendar");
    await expect(page.getByText("Série de 25 peças").first()).toBeVisible();
  });
});
