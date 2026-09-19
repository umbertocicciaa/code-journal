import { expect, test } from "@playwright/test";

test("home redirects to login when logged out", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("signup and journal flow", async ({ page }) => {
  const username = `user_${Date.now()}`;
  await page.goto("/signup");
  await page.getByRole("textbox", { name: "Name", exact: true }).fill("Playwright User");
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByRole("textbox", { name: "Email" }).fill(`${username}@example.com`);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/journal/);
});
