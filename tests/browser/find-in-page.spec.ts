import { expect, test } from "@playwright/test";

test("Find In Page is discoverable with Roam Depot installation instructions", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("textbox", { name: "Search plugins" }).fill("folded");
  await page.getByRole("button", { name: /Navigation/ }).click();
  const card = page.locator('[data-plugin-slug="find-in-page"]');
  await expect(card).not.toContainText("Coming soon");
  await expect(page.locator("#catalog-results h3")).toHaveText([
    "Find In Page",
  ]);
  await card.click();
  await expect(page).toHaveURL(/\/plugins\/find-in-page$/);
  await expect(page).toHaveTitle(/Find In Page/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Find In Page" }),
  ).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Instructions", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Find it in Roam Depot" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View on GitHub" }),
  ).toHaveAttribute("href", "https://github.com/RoamJS/find-in-page");
  await expect(page.getByRole("link", { name: "View source" })).toHaveCount(0);
  await page.getByRole("tab", { name: "Suggest a change" }).click();
  await expect(
    page.getByRole("link", { name: "Share an idea on GitHub" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/RoamJS/find-in-page/issues/new",
  );
  await page.getByRole("tab", { name: "Instructions", exact: true }).click();
  await expect(page.locator("video, iframe")).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("Coming soon");
  await expect(page.locator("article")).toContainText("Settings → Roam Depot");
  await expect(page.locator("article")).not.toContainText(
    "Once the extension is available",
  );
  await expect(page.locator("article")).toContainText("Cmd/Ctrl+Enter");
  await expect(page.locator("article")).toContainText(
    "literal and case-insensitive",
  );
  await expect(page.locator("article")).toContainText("whole graph");
  await page.getByRole("link", { name: "All plugins", exact: true }).click();
  await expect(page).toHaveURL(/\/#plugins$/);
  expect(errors).toEqual([]);
});

test("Find In Page instructions fit mobile in both themes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/plugins/find-in-page");
  for (const theme of ["dark", "light"]) {
    await expect(page.locator("html")).toHaveClass(new RegExp(theme));
    await expect(page.getByRole("table")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (theme === "dark")
      await page.getByRole("button", { name: "Toggle dark mode" }).click();
  }
});
