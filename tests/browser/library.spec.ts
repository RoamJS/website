import { test, expect } from "@playwright/test";
import { plugins } from "../../content/plugins-index.json";
test("catalog search, filtering, sorting, guide and suggestion states", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /A better way to work in Roam/ }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Search plugins" }).fill("calendar");
  await expect(page.getByRole("status")).toHaveText(
    "1 plugin matching “calendar”",
  );
  await page
    .getByRole("textbox", { name: "Search plugins" })
    .fill("zznoresult");
  await expect(
    page.getByRole("heading", { name: "No plugins found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear all filters" }).click();
  await page.getByRole("button", { name: /Navigation/ }).click();
  await expect(page.getByRole("status")).toContainText("navigation");
  await page.getByRole("combobox", { name: "Sort plugins" }).click();
  await page.getByRole("option", { name: "Title (A–Z)" }).click();
  const titles = page.locator("#catalog-results h3");
  await expect(titles).toHaveText(["Breadcrumbs", "Quick Switcher"]);
  await page.getByRole("button", { name: /All plugins/ }).click();
  await expect(titles).toHaveText(
    plugins.map((p) => p.name).sort((a, b) => a.localeCompare(b)),
  );
  await page.getByRole("combobox", { name: "Sort plugins" }).click();
  await page.getByRole("option", { name: "Downloads (high to low)" }).click();
  await expect(titles).toHaveText(
    [...plugins]
      .sort((a, b) => (b.downloads ?? -1) - (a.downloads ?? -1))
      .map((p) => p.name),
  );
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("textbox", { name: "Search plugins" }),
  ).toBeFocused();
  await page.getByRole("textbox", { name: "Search plugins" }).fill("calendar");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Plugin catalog" }),
  ).toBeFocused();
  await page.goto("/plugins/smartblocks");
  await expect(
    page.getByRole("heading", { name: "SmartBlocks", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("From the plugin’s public README")).toBeVisible();
  await page.getByRole("tab", { name: "Suggest a change" }).click();
  await expect(
    page.getByRole("link", { name: "Share an idea on GitHub" }),
  ).toHaveAttribute("href", "https://github.com/RoamJS/smartblocks/issues/new");
  expect(errors).toEqual([]);
});
test("theme persists; mobile layout and keyboard navigation work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("header img")).toHaveJSProperty(
    "naturalWidth",
    460,
  );
  await page.evaluate(() => localStorage.setItem("theme", "light"));
  await page.reload();
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({ path: "local/dark-desktop.png" });
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await page.screenshot({ path: "local/light-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("link", { name: "RoamJS home" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("combobox", { name: "Sort plugins" }).click();
  await page.getByRole("option", { name: "Title (A–Z)" }).click();
  await expect(page.locator("#catalog-results h3").first()).toHaveText(
    "Auto Tag Mode",
  );
  await page
    .getByRole("textbox", { name: "Search plugins" })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: "local/mobile.png" });
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await page.screenshot({ path: "local/mobile-dark.png" });
  await page.goto("/plugins/query-builder");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("tab", { name: "Instructions", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Suggest a change", exact: true }),
  ).toBeFocused();
});
test("support pages and unavailable APIs stay honest", async ({
  page,
  request,
}) => {
  for (const url of ["/getting-started", "/ideas", "/updates", "/privacy"]) {
    await page.goto(url);
    await expect(page.locator("h1")).toBeVisible();
  }
  expect((await page.goto("/plugins/attribute-select"))?.status()).toBe(404);
  await page.goto("/plugins/static-site");
  await expect(
    page.getByText("This repository is marked deprecated.", { exact: false }),
  ).toBeVisible();
  expect((await page.goto("/plugins/not-a-plugin"))?.status()).toBe(404);
  const response = await request.post("/api/suggestions", {
    headers: { Origin: "http://localhost:3215" },
    data: {},
  });
  expect(response.status()).toBe(503);
});

test("all public plugin guides hydrate without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) =>
    errors.push(`${page.url()}: ${error.message}`),
  );
  for (const plugin of plugins) {
    await page.goto(`/plugins/${plugin.slug}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("heading", { level: 1, name: plugin.name, exact: true }),
    ).toBeVisible();
    await page
      .getByRole("tab", { name: "Suggest a change", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: "Share an idea on GitHub" }),
    ).toBeVisible();
  }
  expect(errors).toEqual([]);
});
