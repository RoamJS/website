import { test, expect } from "@playwright/test";

test.skip(
  process.env.SUGGESTION_BROWSER_ENABLED !== "true",
  "Requires an enabled suggestion build",
);
const authUrl = "https://uxihswugvmdwbbtgxtfl.supabase.co/auth/v1";
const savedId = "afc3b29d-c4c6-4ab2-8f79-b0cf2bf516dc";
test("Unicode lengths and retries preserve text and request identity", async ({
  page,
}) => {
  const user = {
    id: "test-user",
    email: "test@example.com",
    email_confirmed_at: "2026-10-06",
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-10-06",
  };
  const encode = (value: unknown): string =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const accessToken = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated" })}.fixture`;
  await page.route(`${authUrl}/otp**`, (route) => route.fulfill({ json: {} }));
  await page.route(`${authUrl}/verify`, (route) =>
    route.fulfill({
      json: {
        user,
        access_token: accessToken,
        refresh_token: "fixture",
        token_type: "bearer",
        expires_in: 3600,
      },
    }),
  );
  await page.route(`${authUrl}/user`, (route) => route.fulfill({ json: user }));
  await page.goto("/account");
  await page.getByLabel("Email address", { exact: true }).fill(user.email);
  await page.getByRole("button", { name: "Email me a sign-in code" }).click();
  await page.getByLabel("Verification code", { exact: false }).fill("123456");
  await page.getByRole("button", { name: "Verify code", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "You’re signed in" }),
  ).toBeVisible();
  await page.goto("/ideas");
  const requests: { requestId: string; title: string; body: string }[] = [];
  await page.route("**/api/suggestions", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: requests.length === 1 ? 503 : 200,
      json:
        requests.length === 1
          ? { error: "Please retry saving." }
          : { id: savedId },
    });
  });
  const title = page.getByLabel("What would you like to see?");
  const body = page.getByLabel("Tell us a little more");
  await title.fill("ab👍c");
  await body.fill("👍".repeat(3000));
  await page.getByRole("button", { name: "Send suggestion" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("at least 5");
  expect(requests).toHaveLength(0);
  await title.fill("👍".repeat(140));
  await page.getByRole("button", { name: "Send suggestion" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Please retry");
  await expect(title).toHaveValue("👍".repeat(140));
  await expect(body).toHaveValue("👍".repeat(3000));
  await page.getByRole("button", { name: "Send suggestion" }).click();
  await expect(page.getByRole("status")).toContainText("Your idea is saved");
  expect(requests).toHaveLength(2);
  expect(requests[0]).toEqual(requests[1]);
  await expect(title).toHaveValue("");
  await expect(body).toHaveValue("");
  await page.goto("/updates");
  await expect(page.getByText("The mailing list is on its way")).toBeVisible();
});
