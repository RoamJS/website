import { test, expect } from "@playwright/test";
const authUrl = "https://uxihswugvmdwbbtgxtfl.supabase.co/auth/v1";
test("email sign-in stays separate from consent and handles failed verification", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.route(`${authUrl}/otp**`, (route) => route.fulfill({ json: {} }));
  await page.route(`${authUrl}/verify`, (route) =>
    route.fulfill({
      status: 403,
      json: { code: "otp_expired", msg: "Token has expired or is invalid" },
    }),
  );
  await page.goto("/account");
  await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Creating an account does not subscribe you to emails.", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("test@example.com");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");
  await page.getByLabel("Verification code", { exact: false }).fill("123456");
  await page.getByRole("button", { name: "Verify code", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "invalid or expired",
  );
  await page.getByRole("button", { name: "Resend sign-in email" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "wait a minute",
  );
  expect(requests.filter((url) => url.includes("/otp"))).toHaveLength(1);
  expect(
    requests.some((url) => /\/api\/(subscriptions|suggestions)/.test(url)),
  ).toBe(false);
  expect(requests.some((url) => url.includes("i.posthog.com"))).toBe(false);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({ path: "local/auth-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "local/auth-mobile.png" });
});
test("callback errors recover on the account page; signed-out API fails closed", async ({
  page,
  request,
}) => {
  await page.goto("/auth/callback");
  await expect(page).toHaveURL(/\/account\?error=expired$/);
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Request a new email",
  );
  const response = await request.get("/api/auth/session");
  expect(response.status()).toBe(401);
  expect(response.headers()["cache-control"]).toContain("no-store");
});
test("a verified browser session survives reload and signs out without subscribing", async ({
  page,
}) => {
  const user = {
    id: "test-user",
    aud: "authenticated",
    role: "authenticated",
    email: "test@example.com",
    email_confirmed_at: "2026-10-06T00:00:00Z",
    app_metadata: { provider: "email" },
    user_metadata: {},
    created_at: "2026-10-06T00:00:00Z",
  };
  const encode = (value: unknown): string =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const accessToken = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated" })}.test-signature`;
  await page.route(`${authUrl}/otp**`, (route) => route.fulfill({ json: {} }));
  await page.route(`${authUrl}/verify`, (route) =>
    route.fulfill({
      json: {
        user,
        access_token: accessToken,
        refresh_token: "test-refresh",
        token_type: "bearer",
        expires_in: 3600,
      },
    }),
  );
  await page.route(`${authUrl}/user`, (route) => route.fulfill({ json: user }));
  await page.route(`${authUrl}/logout**`, (route) =>
    route.fulfill({ status: 204 }),
  );
  await page.goto("/account");
  await page.getByLabel("Email address", { exact: true }).fill(user.email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await page.getByLabel("Verification code", { exact: false }).fill("123456");
  await page.getByRole("button", { name: "Verify code", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "You’re signed in" }),
  ).toBeVisible();
  await expect(
    page.getByText("Your email is verified.", { exact: true }),
  ).toBeVisible();
  // The browser fixture isn't a valid server credential. This proves client UX only.
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "You’re signed in" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
});

test("email delivery errors preserve the address and allow another attempt", async ({
  page,
}) => {
  await page.route(`${authUrl}/otp**`, (route) =>
    route.fulfill({
      status: 429,
      json: {
        code: "over_email_send_rate_limit",
        msg: "Email rate limit exceeded",
      },
    }),
  );
  await page.goto("/account");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("test@example.com");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "couldn’t send",
  );
  await expect(page.getByLabel("Email address", { exact: true })).toHaveValue(
    "test@example.com",
  );
  await expect(page.getByLabel("Email address", { exact: true })).toBeEnabled();
  await expect(
    page.getByLabel("Verification code", { exact: false }),
  ).toHaveCount(0);
  await page.route(`${authUrl}/otp**`, (route) => route.fulfill({ json: {} }));
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");
});
