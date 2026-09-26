import { expect, test } from "@playwright/test";
import { addWatchToBag, closeDrawer, scrollThrough, viaCepOk } from "./helpers";

/**
 * Repeatable visual record of the site: viewport shots for the README and full-page shots for
 * review, written to e2e/screenshots/<project>-<name>.png on every run.
 */
const shot = (name: string) => `e2e/screenshots/${test.info().project.name}-${name}.png`;

test.describe("Screenshots", () => {
  test.describe.configure({ mode: "serial" });

  test("home", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("hero-canvas")).toHaveAttribute("data-ready", "true", { timeout: 30_000 });
    await page.waitForTimeout(2200); // let the hands finish sweeping to the current time
    await page.screenshot({ path: shot("home-hero") });
    await page.getByRole("link", { name: "Ver o calibre" }).click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: shot("home-calibre") });
    await scrollThrough(page);
    await page.screenshot({ path: shot("home-full"), fullPage: true });
  });

  test("collection", async ({ page }) => {
    await page.goto("/colecao");
    await scrollThrough(page);
    await page.screenshot({ path: shot("collection") });
    await page.screenshot({ path: shot("collection-full"), fullPage: true });
  });

  test("product", async ({ page }) => {
    await page.goto("/colecao/lune-39");
    await expect(page.getByTestId("viewer")).toHaveAttribute("data-ready", "true", { timeout: 30_000 });
    await page.waitForTimeout(2200);
    await page.screenshot({ path: shot("product") });
    await page.getByLabel(/Gravação no fundo/).check();
    await page.getByTestId("engraving-input").fill("Para Ana, 2026");
    await page.waitForTimeout(1800);
    await page.getByTestId("viewer").scrollIntoViewIfNeeded();
    await page.screenshot({ path: shot("product-engraving") });
  });

  test("nocturne in the dark", async ({ page }) => {
    await page.goto("/colecao/nocturne-40");
    await expect(page.getByTestId("viewer")).toHaveAttribute("data-ready", "true", { timeout: 30_000 });
    await page.getByRole("radio", { name: "No escuro" }).click();
    await page.waitForTimeout(2200);
    await page.screenshot({ path: shot("product-night") });
  });

  test("bag and checkout", async ({ page }) => {
    await page.route("https://viacep.com.br/ws/**", (route) => route.fulfill({ json: viaCepOk }));
    await addWatchToBag(page, "regulateur-39");
    await page.waitForTimeout(600);
    await page.screenshot({ path: shot("bag-drawer") });
    await closeDrawer(page);
    await page.goto("/checkout");
    await page.getByLabel("E-mail").fill("ana@exemplo.com");
    await page.getByLabel("Nome completo").fill("Ana Guerra");
    await page.getByLabel("Celular").fill("11912345678");
    await page.getByLabel("CEP", { exact: true }).fill("01414001");
    await page.getByLabel("Número", { exact: true }).fill("1421");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: shot("checkout"), fullPage: true });
    await page.getByTestId("place-order").click();
    await expect(page.getByTestId("order-confirmed")).toBeVisible();
    await page.screenshot({ path: shot("confirmation") });
  });

  test("not found", async ({ page }) => {
    await page.goto("/pagina-perdida");
    await page.screenshot({ path: shot("404") });
  });
});
