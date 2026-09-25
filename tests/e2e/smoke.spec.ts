import { expect, test } from "@playwright/test";

test("home redirects to login when logged out", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("signup creates an account and exposes the journal", async ({ page }) => {
  const username = `user${Date.now()}`;
  await page.goto("/signup");
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Name", exact: true }).fill("Playwright User");
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByRole("textbox", { name: "Email" }).fill(`${username}@example.com`);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/journal/);
  await expect(page.getByRole("heading", { name: "Journal" })).toBeVisible();
});

test("MVP smoke: authenticated user can add a manual problem and edit its solution", async ({ page }) => {
  const username = `mvp${Date.now()}`;
  await page.goto("/signup");
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Name", exact: true }).fill("MVP User");
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByRole("textbox", { name: "Email" }).fill(`${username}@example.com`);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/journal/);

  await page.getByLabel(/LeetCode URL/i).fill("https://leetcode.com/problems/two-sum/");
  await page.getByRole("button", { name: /Add problem/i }).click();
  await page.getByRole("link", { name: /two-sum/i }).click();

  await expect(page.getByRole("heading", { name: "Solutions" })).toBeVisible();
  await page.getByRole("button", { name: "New solution" }).click();
  await page.getByLabel("Title").fill("Original solution");
  await page.getByRole("button", { name: "Save solution" }).click();
  await expect(page.getByText("Original solution", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Edit solution Original solution" }).click();
  await expect(page.getByLabel("Title")).toHaveValue("Original solution");
  await page.getByLabel("Title").fill("Edited solution");
  await page.getByRole("button", { name: "Update solution" }).click();
  await expect(page.getByText("Edited solution", { exact: true })).toBeVisible();
  await expect(page.getByText("Original solution", { exact: true })).toHaveCount(0);

  await page.reload();
  await expect(page.getByText("Edited solution", { exact: true })).toBeVisible();
});
