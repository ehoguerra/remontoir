import { expect, type Page } from "@playwright/test";

/** Console errors and uncaught exceptions seen while the test runs. GPU driver chatter is ignored. */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    if (/GL_|WebGL|GPU stall|viacep/i.test(text)) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

/** Scrolls the whole page so lazy images load, then returns to the top. */
export async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page
    .waitForFunction(() => Array.from(document.images).every((img) => img.complete), null, { timeout: 20_000 })
    .catch(() => {});
}

export async function addWatchToBag(page: Page, slug = "lune-39") {
  await page.goto(`/colecao/${slug}`);
  await page.getByTestId("add-to-bag").click();
  await expect(page.getByTestId("bag-drawer")).toBeVisible();
}

export async function closeDrawer(page: Page) {
  await page.getByRole("button", { name: "Fechar sacola" }).click();
  await expect(page.getByTestId("bag-drawer")).toBeHidden();
}

export const viaCepOk = {
  cep: "01414-001",
  logradouro: "Rua Haddock Lobo",
  bairro: "Cerqueira César",
  localidade: "São Paulo",
  uf: "SP",
};
