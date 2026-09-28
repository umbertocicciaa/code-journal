import { expect, test, type Page } from "@playwright/test";

async function signUp(page: Page, prefix: string) {
  const username = `${prefix}${Date.now()}`;
  await page.goto("/signup");
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(`${prefix} User`);
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByRole("textbox", { name: "Email" }).fill(`${username}@example.com`);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/journal/, { timeout: 20_000 });
  return username;
}

async function dismissFeedbackDialog(page: Page, title: string) {
  const dialog = page.getByRole("dialog", { name: title });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "OK" }).click();
  await expect(dialog).toBeHidden();
}

async function addManualProblem(page: Page, slug: string, title: string) {
  await page.getByRole("button", { name: "Enter problem manually" }).click();
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Slug").fill(slug);
  await page.getByLabel("URL").fill(`https://example.com/problems/${slug}`);
  await page.getByLabel("Description (Markdown)").fill("Smoke test problem description.");
  await page.getByRole("button", { name: "Save manual problem" }).click();
  await expect(page).toHaveURL(/\/journal\//);
}

async function saveSolution(page: Page, title: string) {
  if (!(await page.getByRole("button", { name: "Save solution" }).isVisible())) {
    await page.getByRole("button", { name: "New solution" }).click();
  }

  await page.locator("#solution-title").fill(title);
  const saveButton = page.getByRole("button", { name: "Save solution" });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await dismissFeedbackDialog(page, "Solution added");
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}

test("home redirects to login when logged out", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("signup creates an account and exposes the journal", async ({ page }) => {
  await signUp(page, "user");
  await expect(page.getByRole("heading", { name: "Journal" })).toBeVisible();
});

test("forgot password flow resets credentials", async ({ page, request }) => {
  test.setTimeout(60_000);

  const newPassword = "newpassword456";
  const username = await signUp(page, "pw");
  const email = `${username}@example.com`;

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/forgot-password/);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(/check your inbox/i)).toBeVisible();

  const capture = await request.get(
    `/api/test/password-reset/latest?email=${encodeURIComponent(email)}`,
  );
  expect(capture.ok()).toBe(true);
  const body = (await capture.json()) as { token: string };
  expect(body.token).toBeTruthy();

  await page.goto(`/reset-password?token=${body.token}`);
  await page.getByLabel("New password").fill(newPassword);
  await page.getByRole("button", { name: "Reset password" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(newPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/journal/);
});

test("MVP smoke: journal problem CRUD", async ({ page }) => {
  test.setTimeout(60_000);

  const slug = `smoke-problem-${Date.now()}`;
  const title = "Smoke CRUD Problem";
  await signUp(page, "mvp");

  await addManualProblem(page, slug, title);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.getByRole("button", { name: "Mark solved" }).click();
  await expect(page.getByRole("button", { name: "Mark attempting" })).toBeVisible();

  await page.getByPlaceholder("Your notes in markdown...").fill("Remember the edge cases.");
  await page.getByRole("button", { name: "Save notes" }).click();
  await dismissFeedbackDialog(page, "Notes saved");
  await expect(page.getByText("Remember the edge cases.")).toBeVisible();

  await saveSolution(page, "First approach");
  await saveSolution(page, "Optimized approach");

  await page.getByRole("link", { name: "Journal" }).first().click();
  await expect(page).toHaveURL(/\/journal$/);
  const journalEntry = page.getByRole("link", { name: new RegExp(title) });
  await expect(journalEntry).toBeVisible();
  await expect(journalEntry.getByText("Solved", { exact: true })).toBeVisible();

  await journalEntry.click();
  await page.getByRole("button", { name: "Remove from journal" }).click();
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page).toHaveURL(/\/journal$/);
  await expect(page.getByRole("link", { name: new RegExp(title) })).toHaveCount(0);

  await page.getByPlaceholder("https://leetcode.com/problems/two-sum/").fill(
    "https://leetcode.com/problems/two-sum/",
  );
  await page.getByRole("button", { name: /Add problem/i }).click();
  await expect(page).toHaveURL(/\/journal\//);

  await expect(page.getByRole("heading", { name: "Solutions" })).toBeVisible();
  await saveSolution(page, "Original solution");

  await page.reload();
  await expect(page.getByText("Original solution", { exact: true })).toBeVisible();
});
