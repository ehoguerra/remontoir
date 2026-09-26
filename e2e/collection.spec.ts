import { expect, test } from "@playwright/test";

test.describe("Collection", () => {
  test("lists the eight watches by default", async ({ page }) => {
    await page.goto("/colecao");
    await expect(page.getByTestId("result-count")).toHaveText("8 relógios");
    await expect(page.getByTestId("product-card")).toHaveCount(8);
  });

  test("filters by complication and keeps the filter in the URL", async ({ page }) => {
    await page.goto("/colecao");
    await page.getByLabel("Complicação").selectOption("moonphase");
    await expect(page).toHaveURL(/complicacao=moonphase/);
    await expect(page.getByTestId("result-count")).toHaveText("1 relógio");
    await expect(page.getByTestId("product-card")).toContainText("Lune 39");

    await page.reload();
    await expect(page.getByTestId("result-count")).toHaveText("1 relógio");
  });

  test("an impossible combination shows an empty state that can be cleared", async ({ page }) => {
    await page.goto("/colecao?complicacao=chronograph&caixa=titanium");
    await expect(page.getByTestId("empty-state")).toBeVisible();
    await page.getByTestId("empty-state").getByRole("button", { name: "Limpar filtros" }).click();
    await expect(page.getByTestId("result-count")).toHaveText("8 relógios");
    await expect(page).toHaveURL(/\/colecao$/);
  });

  test("sorts by price", async ({ page }) => {
    await page.goto("/colecao");
    await page.getByLabel("Ordenar").selectOption("menor-preco");
    await expect(page.getByTestId("product-card").first()).toContainText("Petite Seconde 36");
    await page.getByLabel("Ordenar").selectOption("maior-preco");
    await expect(page.getByTestId("product-card").first()).toContainText("Régulateur 39");
  });

  test("switches to straps", async ({ page }) => {
    await page.goto("/colecao");
    await page.getByRole("button", { name: "Pulseiras", exact: true }).click();
    await expect(page).toHaveURL(/tipo=pulseiras/);
    await expect(page.getByTestId("result-count")).toHaveText("4 pulseiras");
    await expect(page.getByLabel("Complicação")).toHaveCount(0);
  });

  test("a card opens its product page", async ({ page }) => {
    await page.goto("/colecao");
    await page.getByRole("link", { name: "Nocturne 40" }).first().click();
    await expect(page).toHaveURL(/\/colecao\/nocturne-40$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nocturne 40");
  });
});
