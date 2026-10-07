import { test, expect } from "@playwright/test";
const fixture = {
  id: "63fbb2d2-3b95-4d1f-bd6c-9aa7c2177210",
  email: "author@example.com",
  plugin_slug: "smartblocks",
  title: "Reusable meeting templates",
  body: "Help me reuse a template across different meeting pages.",
  created_at: "2026-10-06T12:00:00Z",
  status: "new",
  follow_up_note: "",
  followed_up_at: null as string | null,
  updated_at: "2026-10-06T12:00:00Z",
  version: 1,
};
test("owner review saves status, recovers failed writes, and records manual follow-up", async ({
  page,
}) => {
  let saved = { ...fixture };
  let fail = true;
  let writes = 0;
  await page.route("**/api/admin/suggestions**", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { items: [saved], hasMore: false } });
    writes++;
    if (fail) {
      fail = false;
      return route.fulfill({
        status: 503,
        json: { error: "Please retry. Your changes were not saved." },
      });
    }
    const body = route.request().postDataJSON();
    saved = {
      ...saved,
      status: body.status,
      follow_up_note: body.note,
      followed_up_at: body.recordFollowUp
        ? "2026-10-07T00:00:00Z"
        : saved.followed_up_at,
      version: saved.version + 1,
    };
    return route.fulfill({ json: saved });
  });
  await page.goto("/admin/suggestions");
  await page
    .getByRole("button", { name: /Reusable meeting templates/ })
    .click();
  await expect(
    page.getByRole("link", { name: /Open email reply/ }),
  ).toHaveAttribute("href", /^mailto:author%40example.com\?subject=/);
  expect(writes).toBe(0);
  await page.getByLabel("Status", { exact: true }).selectOption("planned");
  await page
    .getByLabel("Private follow-up note")
    .fill("Discuss after the next release.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Please retry",
  );
  await expect(page.getByLabel("Private follow-up note")).toHaveValue(
    "Discuss after the next release.",
  );
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("main").getByRole("status")).toContainText(
    "Changes saved",
  );
  expect(saved.followed_up_at).toBeNull();
  await page.getByRole("checkbox", { name: /I sent a reply/ }).check();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText(/Last follow-up:/)).toBeVisible();
  await page.getByRole("button", { name: /Back to inbox/ }).click();
  await expect(
    page.getByRole("button", { name: /Reusable meeting templates/ }),
  ).toContainText("Planned");
});
test("private inbox has no horizontal overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/admin/suggestions**", (route) =>
    route.fulfill({ json: { items: [fixture], hasMore: false } }),
  );
  await page.goto("/admin/suggestions");
  await page
    .getByRole("button", { name: /Reusable meeting templates/ })
    .click();
  await expect(page.getByLabel("Private follow-up note")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "local/inbox-mobile.png", fullPage: true });
});
test("signed-out and denied states expose no private cards", async ({
  page,
}) => {
  let status = 401;
  await page.route("**/api/admin/suggestions**", (route) =>
    route.fulfill({
      status,
      json: {
        error:
          status === 401
            ? "Please sign in to continue."
            : "This inbox is only available to the site owner.",
      },
    }),
  );
  await page.goto("/admin/suggestions");
  await expect(
    page.getByRole("link", { name: /Sign in, then return/ }),
  ).toBeVisible();
  await expect(page.getByText(fixture.email)).toHaveCount(0);
  status = 403;
  await page.getByRole("button", { name: "Refresh" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "only available to the site owner",
  );
  await expect(
    page.getByRole("link", { name: /Sign in, then return/ }),
  ).toHaveCount(0);
});
test("filters, empty state and pagination keep bounded requests", async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route("**/api/admin/suggestions**", (route) => {
    requests.push(route.request().url());
    const url = new URL(route.request().url());
    return route.fulfill({
      json: {
        items: url.searchParams.get("search") ? [] : [fixture],
        hasMore: url.searchParams.get("page") === "0",
      },
    });
  });
  await page.goto("/admin/suggestions");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Page 2")).toBeVisible();
  await page.getByLabel("Search suggestions").fill("missing");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText("No suggestions here yet")).toBeVisible();
  await page.getByLabel("Filter by status").selectOption("completed");
  await expect.poll(() => requests.at(-1)).toContain("status=completed");
  expect(requests.at(-1)).toContain("page=0");
});
