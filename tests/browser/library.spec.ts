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
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const documentTop = (): Promise<number> =>
    catalogSearch.evaluate(
      (element) => element.getBoundingClientRect().top + window.scrollY,
    );
  const beforeSearch = await documentTop();
  await catalogSearch.fill("calendar");
  await expect(
    page.getByRole("region", { name: "Featured plugins", exact: true }),
  ).toBeVisible();
  expect(await documentTop()).toBe(beforeSearch);
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
  await expect(page.locator("header img")).toHaveJSProperty("naturalWidth", 96);
  await expect(
    page.locator('link[rel="icon"][type="image/svg+xml"]'),
  ).toHaveAttribute("href", /^\/icon\.svg/);
  await expect(
    page.locator('link[rel="icon"][type="image/x-icon"]'),
  ).toHaveAttribute("href", /^\/favicon\.ico/);
  const favicon = await page.request.get("/favicon.ico");
  expect(favicon.ok()).toBe(true);
  expect((await favicon.body()).subarray(0, 4)).toEqual(
    Buffer.from([0, 0, 1, 0]),
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
  expect([401, 503]).toContain(response.status());
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
  await expect(headings).toHaveText(["Breadcrumbs", "Stats", "Giphy"]);
  await expect(
    featured.getByRole("group", { name: "More to explore, 2 of 3" }),
  ).toBeVisible();
  await expect(
    featured.getByRole("link", { name: "View plugin", exact: true }),
  ).toHaveAttribute("href", "/plugins/breadcrumbs");
  await expect(featured.getByRole("link", { name: /^Stats / })).toHaveAttribute(
    "href",
    "/plugins/stats",
  );
  await expect(featured.getByRole("link", { name: /^Giphy / })).toHaveAttribute(
    "href",
    "/plugins/giphy",
  );
  expect((await search.boundingBox())?.y).toBe(before?.y);
  await next.press("ArrowRight");
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
  await featured.getByRole("button", { name: "Show more to explore" }).click();
  await expect(headings).toHaveText(["Breadcrumbs", "Stats", "Giphy"]);
  expect((await search.boundingBox())?.y).toBe(mobileBefore?.y);
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

test("header shrinks without shifting content and mobile navigation stays accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const header = page.locator("header");
  await expect(header).toHaveAttribute("data-compact", "false");
  await expect.poll(async () => (await header.boundingBox())?.height).toBe(96);
  await page.evaluate(() => window.scrollTo({ top: 260, behavior: "instant" }));
  await expect(header).toHaveAttribute("data-compact", "true");
  await expect.poll(async () => (await header.boundingBox())?.height).toBe(64);
  expect(await page.evaluate(() => window.scrollY)).toBe(260);
  expect((await header.boundingBox())?.y).toBe(0);
  await page.screenshot({ path: "local/header-compact-desktop.png" });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect.poll(async () => (await header.boundingBox())?.height).toBe(96);
  for (const width of [320, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 320, height: 844 });
  await expect(
    page.getByRole("navigation", { name: "Main navigation", exact: true }),
  ).toBeHidden();
  const trigger = page.getByRole("button", { name: "Open navigation menu" });
  await expect(trigger).toBeVisible();
  expect((await trigger.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await trigger.click();
  const menu = page.getByRole("dialog", { name: "Navigation menu" });
  await expect(menu).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(menu.getByRole("link")).toHaveCount(
    (await menu.getByRole("link", { name: "Sign in", exact: true }).count())
      ? 5
      : 4,
  );
  for (const link of await menu.getByRole("link").all()) {
    expect((await link.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({ path: "local/header-mobile-menu.png" });
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.press("Enter");
  await menu.getByRole("link", { name: "Get started", exact: true }).click();
  await expect(page).toHaveURL(/getting-started$/);
  await expect(menu).toBeHidden();
  await trigger.click();
  await menu.getByRole("link", { name: "Plugins", exact: true }).click();
  await expect(page).toHaveURL(/#plugins$/);
  await expect(menu).toBeHidden();
  await expect(header).toHaveAttribute("data-compact", "true");
  await expect.poll(async () => (await header.boundingBox())?.height).toBe(56);
  await trigger.click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(menu).toBeHidden();
  await expect(
    page.getByRole("navigation", { name: "Main navigation", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await trigger.click();
  await page.screenshot({ path: "local/header-mobile-menu-light.png" });
  await menu.getByRole("button", { name: "Close navigation menu" }).click();
  await expect(menu).toBeHidden();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await header.evaluate((element) =>
      parseFloat(getComputedStyle(element).transitionDuration),
    ),
  ).toBeLessThanOrEqual(0.001);
  await page.setViewportSize({ width: 844, height: 390 });
  await trigger.click();
  await expect
    .poll(async () => (await menu.boundingBox())?.y ?? -1)
    .toBeGreaterThanOrEqual(0);
  await expect
    .poll(async () => {
      const box = await menu.boundingBox();
      return box ? box.y + box.height : Infinity;
    })
    .toBeLessThanOrEqual(390);
  await menu.getByRole("button", { name: "Close navigation menu" }).click();
});
