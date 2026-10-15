import { expect, test } from "@playwright/test";

test.skip(
  !process.env.NEXT_PUBLIC_AUTH_TURNSTILE_SITE_KEY,
  "Build with the public Turnstile test site key to exercise the challenge flow",
);

const AUTH_OTP_URL = "https://uxihswugvmdwbbtgxtfl.supabase.co/auth/v1/otp";
const TURNSTILE_SCRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

test("requires a fresh challenge for each email request", async ({ page }) => {
  const requests: Record<string, unknown>[] = [];
  let failFirst = true;
  await page.route(TURNSTILE_SCRIPT, (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.testTurnstile = { resetCount: 0 };
        window.turnstile = {
          render: function (container, options) {
            window.testTurnstile.options = options;
            window.testTurnstile.container = container;
            var widget = document.createElement('div');
            widget.style.width = options.size === 'compact' ? '150px' : '300px';
            widget.style.height = options.size === 'compact' ? '140px' : '65px';
            container.replaceChildren(widget);
            return 'test-widget';
          },
          reset: function () { window.testTurnstile.resetCount++; },
          remove: function () { window.testTurnstile.container.replaceChildren(); }
        };`,
    }),
  );
  await page.route(`${AUTH_OTP_URL}**`, async (route) => {
    requests.push(route.request().postDataJSON());
    if (failFirst) {
      failFirst = false;
      await route.fulfill({
        status: 429,
        json: { code: "over_email_send_rate_limit", msg: "Unavailable" },
      });
      return;
    }
    await route.fulfill({ json: {} });
  });

  await page.goto("/account");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("test@example.com");
  await page.getByRole("button", { name: "Email me a sign-in code" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Complete the security check",
  );
  expect(requests).toHaveLength(0);

  await page.waitForFunction(
    () =>
      !!(window as unknown as { testTurnstile?: { options?: unknown } })
        .testTurnstile?.options,
  );
  await page.evaluate(() =>
    (
      window as unknown as {
        testTurnstile: { options: { callback: (token: string) => void } };
      }
    ).testTurnstile.options.callback("first-token"),
  );
  await page.getByRole("button", { name: "Email me a sign-in code" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "couldn’t send",
  );
  expect(requests).toHaveLength(1);
  expect(requests[0].gotrue_meta_security).toEqual({
    captcha_token: "first-token",
  });
  await page.getByRole("button", { name: "Email me a sign-in code" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Complete the security check",
  );
  expect(requests).toHaveLength(1);

  await page.evaluate(() =>
    (
      window as unknown as {
        testTurnstile: { options: { callback: (token: string) => void } };
      }
    ).testTurnstile.options.callback("second-token"),
  );
  await page.getByRole("button", { name: "Email me a sign-in code" }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");
  expect(requests).toHaveLength(2);
  expect(requests[1].gotrue_meta_security).toEqual({
    captcha_token: "second-token",
  });
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { testTurnstile: { resetCount: number } })
          .testTurnstile.resetCount,
    ),
  ).toBe(2);
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as unknown as {
                testTurnstile: { options: { size: "compact" | "flexible" } };
              }
            ).testTurnstile.options.size,
        ),
      )
      .toBe(width < 390 ? "compact" : "flexible");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("expired or unavailable checks never request email", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().startsWith(AUTH_OTP_URL)) requests.push(request.url());
  });
  await page.route(TURNSTILE_SCRIPT, (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.turnstile = {
        render: function (_container, options) {
          window.testTurnstile = options;
          return 'test-widget';
        },
        reset: function () {},
        remove: function () {}
      };`,
    }),
  );
  await page.goto("/account");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("test@example.com");
  await page.waitForFunction(
    () =>
      !!(window as unknown as { testTurnstile?: { callback?: unknown } })
        .testTurnstile?.callback,
  );
  await page.evaluate(() => {
    const options = (
      window as unknown as {
        testTurnstile: {
          callback: (token: string) => void;
          "expired-callback": () => void;
        };
      }
    ).testTurnstile;
    options.callback("expired-token");
    options["expired-callback"]();
  });
  await page.getByRole("button", { name: "Email me a sign-in code" }).click();
  await expect(page.locator("main").getByRole("alert").first()).toContainText(
    "expired",
  );
  expect(requests).toHaveLength(0);
});

test("a loaded script without the widget API offers recovery", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().startsWith(AUTH_OTP_URL)) requests.push(request.url());
  });
  await page.route(TURNSTILE_SCRIPT, (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "window.turnstile = undefined;",
    }),
  );
  await page.goto("/account");
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Security check could not load",
  );
  await expect(
    page.getByRole("button", { name: "Retry security check" }),
  ).toBeVisible();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("test@example.com");
  await page.getByRole("button", { name: "Email me a sign-in code" }).click();
  expect(requests).toHaveLength(0);
});
