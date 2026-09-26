import { expect, test, type Page } from "@playwright/test";
import { addWatchToBag, viaCepOk } from "./helpers";

async function fillContact(page: Page) {
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  await page.getByLabel("Nome completo").fill("Ana Guerra");
  await page.getByLabel("Celular").fill("11912345678");
}

test.describe("Checkout", () => {
  test("with an empty bag there is nothing to pay", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByTestId("checkout-empty")).toBeVisible();
  });

  test("lists every missing field and links to it", async ({ page }) => {
    await addWatchToBag(page);
    await page.goto("/checkout");
    await page.getByTestId("place-order").click();
    const summary = page.getByTestId("error-summary");
    await expect(summary).toContainText("Faltam corrigir 9 campos");
    await expect(page.getByLabel("E-mail")).toHaveAttribute("aria-invalid", "true");
    await summary.getByRole("link", { name: "O CEP tem 8 números." }).click();
    await expect(page).toHaveURL(/#cep$/);
  });

  test("fills the address from the CEP and places a Pix order with 5% off", async ({ page }) => {
    await page.route("https://viacep.com.br/ws/**", (route) => route.fulfill({ json: viaCepOk }));
    await addWatchToBag(page, "lune-39");
    await page.goto("/checkout");
    await fillContact(page);
    await page.getByLabel("CEP", { exact: true }).fill("01414001");
    await expect(page.getByLabel("CEP", { exact: true })).toHaveValue("01414-001");
    await expect(page.getByLabel("Rua", { exact: true })).toHaveValue("Rua Haddock Lobo");
    await expect(page.getByLabel("Cidade", { exact: true })).toHaveValue("São Paulo");
    await expect(page.getByLabel("UF", { exact: true })).toHaveValue("SP");
    await expect(page.getByLabel("Número", { exact: true })).toBeFocused();
    await page.getByLabel("Número", { exact: true }).fill("1421");

    await expect(page.getByTestId("checkout-total")).toHaveText("R$ 55.480");
    await page.getByTestId("place-order").click();

    await expect(page).toHaveURL(/\/checkout\/confirmado$/);
    await expect(page.getByTestId("order-confirmed")).toContainText("Pedido confirmado.");
    await expect(page.getByTestId("order-confirmed")).toContainText(/Pedido R-\d{4}-\d{5}/);
    await expect(page.getByRole("img", { name: "Código Pix de demonstração" })).toBeVisible();
    await expect(page.getByTestId("bag-count")).toHaveCount(0);
  });

  test("an unknown CEP says so and the address can be typed", async ({ page }) => {
    await page.route("https://viacep.com.br/ws/**", (route) => route.fulfill({ json: { erro: "true" } }));
    await addWatchToBag(page);
    await page.goto("/checkout");
    await page.getByLabel("CEP", { exact: true }).fill("99999999");
    await expect(page.getByText("CEP não encontrado. Confira os números ou preencha o endereço.")).toBeVisible();
  });

  test("card payment checks the number before confirming", async ({ page }) => {
    await page.route("https://viacep.com.br/ws/**", (route) => route.fulfill({ json: viaCepOk }));
    await addWatchToBag(page, "nocturne-40");
    await page.goto("/checkout");
    await fillContact(page);
    await page.getByLabel("CEP", { exact: true }).fill("01414001");
    await page.getByLabel("Número", { exact: true }).fill("1421");
    await page.getByText("Cartão de crédito", { exact: true }).click();
    await page.getByLabel("Número do cartão").fill("4242 4242 4242 4241");
    await page.getByLabel("Validade").fill("1230");
    await page.getByLabel("Nome impresso no cartão").fill("ANA GUERRA");
    await page.getByLabel("Código de segurança").fill("123");
    await page.getByTestId("place-order").click();
    await expect(page.getByTestId("error-cardNumber")).toHaveText("Confira o número do cartão.");

    await page.getByLabel("Número do cartão").fill("4242424242424242");
    await expect(page.getByLabel("Número do cartão")).toHaveValue("4242 4242 4242 4242");
    await expect(page.getByTestId("checkout-total")).toHaveText("R$ 42.800");
    await page.getByTestId("place-order").click();
    await expect(page).toHaveURL(/\/checkout\/confirmado$/);
    await expect(page.getByTestId("order-confirmed")).toContainText("Cartão de crédito");
  });
});
