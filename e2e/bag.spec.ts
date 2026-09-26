import { expect, test } from "@playwright/test";
import { addWatchToBag, closeDrawer } from "./helpers";

test.describe("Bag", () => {
  test("starts empty and invites to the collection", async ({ page }) => {
    await page.goto("/sacola");
    await expect(page.getByTestId("bag-empty")).toBeVisible();
    await expect(page.getByTestId("bag-empty").getByRole("link", { name: "Ver a coleção" })).toBeVisible();
  });

  test("persists across reloads and updates quantities and totals", async ({ page }) => {
    await addWatchToBag(page, "gmt-40");
    await closeDrawer(page);
    await page.reload();
    await expect(page.getByTestId("bag-count")).toHaveText("1");

    await page.goto("/sacola");
    const line = page.locator("#conteudo").getByTestId("bag-line");
    await expect(line).toContainText("GMT 40");
    await line.getByRole("button", { name: "Aumentar quantidade" }).click();
    await expect(line.getByTestId("line-qty")).toHaveText("2");
    await expect(page.getByTestId("bag-total")).toHaveText("R$ 99.400");
    await line.getByRole("button", { name: "Diminuir quantidade" }).click();
    await expect(page.getByTestId("bag-total")).toHaveText("R$ 49.700");

    await line.getByRole("button", { name: "Remover" }).click();
    await expect(page.getByTestId("bag-empty")).toBeVisible();
    await expect(page.getByTestId("bag-count")).toHaveCount(0);
  });

  test("the drawer closes with Escape and returns to the page", async ({ page }) => {
    await addWatchToBag(page, "lune-39");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("bag-drawer")).toBeHidden();
    await page.getByTestId("bag-button").click();
    await expect(page.getByTestId("bag-drawer")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Sua sacola/ })).toBeVisible();
  });
});
