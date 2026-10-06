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
  await expect(page.getByText("More flow.", { exact: false })).toBeVisible();
  await expect(page.getByText("Browse plugins", { exact: true })).toHaveCount(
    0,
  );
  const catalogSearch = page
    .locator("#plugins")
    .getByRole("textbox", { name: "Search plugins" });
  await expect(catalogSearch).toBeVisible();
  const beforeSearch = await catalogSearch.boundingBox();
  await catalogSearch.fill("calendar");
  await expect(
    page.getByRole("region", { name: "Featured plugins", exact: true }),
  ).toBeVisible();
  expect((await catalogSearch.boundingBox())?.y).toBe(beforeSearch?.y);
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
  await page.getByRole("combobox", { name: "Sort plugins" }).click();
  await page.getByRole("option", { name: "Newest", exact: true }).click();
  await expect(titles.first()).toHaveText("Quick Switcher");
  await page.getByRole("button", { name: /Navigation/ }).click();
  await expect(titles).toHaveText(["Quick Switcher", "Breadcrumbs"]);
  await expect(page.getByText("Sort by", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: /All plugins/ }).click();
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("textbox", { name: "Search plugins" }),
  ).toBeFocused();
  await page.getByRole("textbox", { name: "Search plugins" }).fill("calendar");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("region", { name: "Plugin results", exact: true }),
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
  const themeToggle = page.getByRole("button", { name: "Toggle dark mode" });
  await expect(themeToggle.locator("svg:visible")).toHaveCount(1);
  await expect(themeToggle.locator(".lucide-sun")).toBeVisible();
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
  await expect(page.locator("html")).toHaveClass(/light/);
  await expect(themeToggle.locator("svg:visible")).toHaveCount(1);
  await expect(themeToggle.locator(".lucide-moon")).toBeVisible();
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
  expect((await page.goto("/plugins/static-site"))?.status()).toBe(404);
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

test("featured carousel promotes newer plugins and stays stable when paging", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1404, height: 940 });
  await page.goto("/");
  const featured = page.getByRole("region", {
    name: "Featured plugins",
    exact: true,
  });
  const newer = featured.getByRole("button", { name: "Show newer plugins" });
  const popular = featured.getByRole("button", {
    name: "Show popular plugins",
  });
  const headings = featured.getByRole("heading", { level: 3 });
  const search = page.getByRole("textbox", { name: "Search plugins" });
  await expect(headings).toHaveText([
    "Custom Dark Mode",
    "Quick Switcher",
    "Sticky Notes",
  ]);
  await expect(newer).toHaveAttribute("aria-pressed", "true");
  await expect(
    featured.getByRole("link", { name: "View plugin", exact: true }),
  ).toHaveAttribute("href", "/plugins/custom-dark-mode");
  const before = await search.boundingBox();
  const next = featured.getByRole("button", { name: "Next featured plugins" });
  await next.click();
  await expect(headings).toHaveText([
    "SmartBlocks",
    "Query Builder",
    "Workbench",
  ]);
  await expect(popular).toHaveAttribute("aria-pressed", "true");
  await expect(next).toBeFocused();
  expect((await search.boundingBox())?.y).toBe(before?.y);
  await next.press("ArrowRight");
  await expect(newer).toHaveAttribute("aria-pressed", "true");
  await featured
    .getByRole("button", { name: "Previous featured plugins" })
    .click();
  await expect(popular).toHaveAttribute("aria-pressed", "true");
  await newer.click();
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await page.screenshot({ path: "local/featured-carousel-light.png" });
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await page.screenshot({ path: "local/featured-carousel-dark.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await newer.scrollIntoViewIfNeeded();
  const mobileBefore = await search.boundingBox();
  await popular.click();
  expect((await search.boundingBox())?.y).toBe(mobileBefore?.y);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(headings).toHaveText([
    "SmartBlocks",
    "Query Builder",
    "Workbench",
  ]);
  await newer.click();
  await page.screenshot({
    path: "local/featured-carousel-mobile.png",
    fullPage: true,
  });
});
