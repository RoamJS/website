import { expect, test } from "@playwright/test";
import { gunzipSync } from "node:zlib";

type CapturedEvent = { event: string; properties: Record<string, unknown> };

test.use({
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
});

test("analytics captures page navigation, plugin discovery and carousel controls without private text", async ({
  page,
}) => {
  const events: CapturedEvent[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    Object.defineProperty(navigator, "userAgentData", { get: () => undefined });
  });
  await page.route(/https:\/\/[^/]*posthog\.com\//, async (route) => {
    const body = route.request().postDataBuffer();
    if (body) {
      const text = (
        body[0] === 31 && body[1] === 139 ? gunzipSync(body) : body
      ).toString();
      const payload = JSON.parse(text);
      events.push(
        ...(Array.isArray(payload) ? payload : (payload.batch ?? [payload])),
      );
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"status":1}',
    });
  });
  await page.goto(
    "/?email=private-canary@example.com&code=secret-canary#private-fragment",
  );
  const featured = page.getByRole("region", { name: "Featured plugins" });
  await featured.getByRole("button", { name: "Next featured plugins" }).click();
  await featured
    .getByRole("link", { name: "View plugin", exact: true })
    .click();
  await expect(page).toHaveURL(/\/plugins\/breadcrumbs$/);
  await expect
    .poll(() => events.filter((e) => e.event === "$pageview").length)
    .toBe(2);
  expect(events.filter((e) => e.event === "plugin clicked")).toHaveLength(1);
  expect(
    events.find((e) => e.event === "plugin clicked")?.properties,
  ).toMatchObject({
    plugin_slug: "breadcrumbs",
    source: "featured",
    placement: "lead",
    carousel_position: 2,
  });
  expect(events.filter((e) => e.event === "carousel navigated")).toHaveLength(
    1,
  );
  expect(
    events.find((e) => e.event === "carousel navigated")?.properties,
  ).toMatchObject({ from_position: 1, to_position: 2, control: "next" });

  await page.goBack();
  const next = featured.getByRole("button", { name: "Next featured plugins" });
  await next.focus();
  await next.press("ArrowRight");
  await featured.getByRole("button", { name: "Show popular plugins" }).click();
  await page.getByRole("button", { name: /^Productivity/ }).click();
  await page.getByRole("combobox", { name: "Sort plugins" }).click();
  await page.getByRole("option", { name: "Title (A–Z)" }).click();
  const search = page
    .getByRole("searchbox", { name: "Search plugins" })
    .or(page.getByRole("textbox", { name: "Search plugins" }));
  await search.fill("private-search-canary");
  await search.press("Enter");
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await page
    .getByRole("region", { name: "Plugin results" })
    .getByRole("link")
    .first()
    .click();
  await expect
    .poll(() => events.filter((e) => e.event === "plugin clicked").length)
    .toBe(2);
  expect(
    events.filter((e) => e.event === "plugin clicked")[1].properties.source,
  ).toBe("catalog");
  expect(
    events.some(
      (e) =>
        e.event === "carousel navigated" &&
        e.properties.input_method === "keyboard",
    ),
  ).toBe(true);
  expect(
    events.some(
      (e) =>
        e.event === "catalog filtered" &&
        e.properties.category === "Productivity",
    ),
  ).toBe(true);
  expect(
    events.some(
      (e) => e.event === "catalog sorted" && e.properties.sort === "name",
    ),
  ).toBe(true);
  expect(
    events.some(
      (e) => e.event === "catalog searched" && e.properties.result_count === 0,
    ),
  ).toBe(true);
  await page.evaluate(() => {
    const fixture = document.createElement("div");
    fixture.innerHTML =
      '<div data-ph-no-autocapture><input aria-label="Private fixture" value="private-form-canary"><button data-attr="private-form-canary">Submit fixture</button></div><div class="cl-rootBox"><button data-attr="private-clerk-canary">Account fixture</button></div>';
    document.body.append(fixture);
  });
  await page
    .getByRole("textbox", { name: "Private fixture" })
    .fill("private-form-canary");
  await page.getByRole("button", { name: "Submit fixture" }).click();
  await page.getByRole("button", { name: "Account fixture" }).click();
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Privacy", exact: true })
    .click();
  await expect
    .poll(() =>
      events.some(
        (e) =>
          e.event === "site link clicked" && e.properties.source === "footer",
      ),
    )
    .toBe(true);
  expect(JSON.stringify(events)).not.toMatch(
    /private-form-canary|private-clerk-canary/,
  );
  expect(events.some((e) => e.event === "$autocapture")).toBe(true);
  expect(events.every((e) => e.properties.environment === "development")).toBe(
    true,
  );
  expect(JSON.stringify(events)).not.toMatch(
    /private-canary|secret-canary|private-fragment|private-search-canary/,
  );
  expect(
    events.some((e) => e.event === "$snapshot" || e.event === "$identify"),
  ).toBe(false);
});

test("Global Privacy Control prevents analytics initialization", async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route(/https:\/\/[^/]*posthog\.com\//, (route) => {
    requests.push(route.request().url());
    return route.abort();
  });
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "globalPrivacyControl", {
      get: () => true,
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await page
    .getByRole("region", { name: "Featured plugins" })
    .getByRole("button", { name: "Next featured plugins" })
    .click();
  expect(requests).toHaveLength(0);
});

test("OAuth pages do not initialize analytics", async ({ page }) => {
  const requests: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    Object.defineProperty(navigator, "userAgentData", { get: () => undefined });
  });
  await page.route(/https:\/\/[^/]*posthog\.com\//, (route) => {
    requests.push(route.request().url());
    return route.abort();
  });
  await page.goto("/oauth?code=private-oauth-canary");
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => key.includes("posthog")),
    ),
  ).toHaveLength(0);
  expect(requests).toHaveLength(0);
});
