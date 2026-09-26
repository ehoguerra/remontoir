import { expect, test } from "@playwright/test";
import { trackErrors } from "./helpers";

// Without a GPU, WebGL would render in software: the site keeps its posters instead.
test.use({ launchOptions: { args: ["--disable-gpu"] } });

test("the hero keeps the rendered poster instead of a software-rendered scene", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await page.waitForLoadState("load");
  // the live watch would mount on the first idle callback after load
  await page.evaluate(() => new Promise((r) => requestIdleCallback(() => requestIdleCallback(r))));
  await expect(page.getByTestId("hero-canvas")).toHaveCount(0);
  await expect(page.locator('img[src*="lune-39-hero"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test("the product page still shows the watch and sells it", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/colecao/lune-39");
  await page.waitForLoadState("load");
  await page.evaluate(() => new Promise((r) => requestIdleCallback(() => requestIdleCallback(r))));
  await expect(page.getByTestId("viewer").locator(".viewer-canvas")).toHaveCount(0);
  await expect(page.getByTestId("viewer").getByRole("img", { name: "Lune 39" })).toBeVisible();
  await page.getByRole("button", { name: "Adicionar à sacola" }).click();
  await expect(page.getByRole("dialog")).toContainText("Lune 39");
  expect(errors).toEqual([]);
});
