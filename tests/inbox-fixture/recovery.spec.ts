import { test, expect } from "@playwright/test";
const item = {
  id: "63fbb2d2-3b95-4d1f-bd6c-9aa7c2177210",
  email: "author@example.com",
  plugin_slug: "smartblocks",
  title: "Meeting templates",
  body: "Reusable meeting notes.",
  created_at: "2026-10-06T12:00:00Z",
  status: "new",
  follow_up_note: "",
  followed_up_at: null,
  updated_at: "2026-10-06T12:00:00Z",
  version: 1,
};
test("draft survives client navigation and browser history, and clears on sign-out", async ({
  page,
}) => {
  await page.route("**/api/admin/suggestions**", (route) =>
    route.fulfill({ json: { items: [item], hasMore: false } }),
  );
  await page.goto("/home");
  await page.getByRole("link", { name: "Inbox", exact: true }).click();
  await page.getByRole("button", { name: /Meeting templates/ }).click();
  await page.getByLabel("Private follow-up note").fill("Unsaved private note");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page.getByLabel("Private follow-up note")).toHaveValue(
    "Unsaved private note",
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Home fixture" }),
  ).toBeVisible();
  await page.goBack();
  await page.getByRole("button", { name: /Meeting templates/ }).click();
  await expect(page.getByLabel("Private follow-up note")).toHaveValue(
    "Unsaved private note",
  );
  await expect(
    page.getByText("Your unsaved draft was restored."),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Home fixture" }),
  ).toBeVisible();
  await page.goForward();
  await page.getByRole("button", { name: /Meeting templates/ }).click();
  await expect(page.getByLabel("Private follow-up note")).toHaveValue(
    "Unsaved private note",
  );
  await page.getByRole("button", { name: "Sign out fixture" }).click();
  await expect(page.getByLabel("Private follow-up note")).toHaveCount(0);
  await page.getByRole("button", { name: "Sign in fixture" }).click();
  await page.getByRole("button", { name: /Meeting templates/ }).click();
  await expect(page.getByLabel("Private follow-up note")).toHaveValue("");
});
test("stale write loads the current version, keeps the draft explicitly, then retries safely", async ({
  page,
}) => {
  const writes: { version: number; note: string }[] = [];
  await page.route("**/api/admin/suggestions**", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "GET")
      return route.fulfill({
        json: url.searchParams.has("id")
          ? {
              ...item,
              version: 2,
              status: "reviewing",
              follow_up_note: "Other tab note",
            }
          : { items: [item], hasMore: false },
      });
    const body = request.postDataJSON();
    writes.push(body);
    if (body.version === 1)
      return route.fulfill({
        status: 409,
        json: { error: "Changed in another session" },
      });
    return route.fulfill({
      json: {
        ...item,
        version: 3,
        status: body.status,
        follow_up_note: body.note,
      },
    });
  });
  await page.goto("/admin/suggestions");
  await page.getByRole("button", { name: /Meeting templates/ }).click();
  await page.getByLabel("Private follow-up note").fill("My draft");
  await page.getByLabel("Status", { exact: true }).selectOption("planned");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("alert")).toContainText("Changed");
  await expect(
    page.getByRole("button", { name: "Save changes" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Load latest saved review" }).click();
  await expect(page.getByText("Saved note: Other tab note")).toBeVisible();
  await expect(page.getByLabel("Private follow-up note")).toHaveValue(
    "My draft",
  );
  await page.getByRole("button", { name: "Keep my draft" }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toHaveText("Changes saved.");
  expect(writes.map((w) => w.version)).toEqual([1, 2]);
  expect(writes[1].note).toBe("My draft");
});
test("using the saved version discards edits only after an explicit choice", async ({
  page,
}) => {
  await page.route("**/api/admin/suggestions**", (route) =>
    route.fulfill({
      status: route.request().method() === "PATCH" ? 409 : 200,
      json:
        route.request().method() === "PATCH"
          ? { error: "Changed" }
          : new URL(route.request().url()).searchParams.has("id")
            ? {
                ...item,
                version: 2,
                status: "completed",
                follow_up_note: "Saved elsewhere",
              }
            : { items: [item], hasMore: false },
    }),
  );
  await page.goto("/admin/suggestions");
  await page.getByRole("button", { name: /Meeting templates/ }).click();
  await page.getByLabel("Private follow-up note").fill("Local changes");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByRole("button", { name: "Load latest saved review" }).click();
  await page.getByRole("button", { name: "Use saved version" }).click();
  await expect(page.getByLabel("Private follow-up note")).toHaveValue(
    "Saved elsewhere",
  );
  await expect(page.getByLabel("Status", { exact: true })).toHaveValue(
    "completed",
  );
  await expect(
    page.getByRole("button", { name: "Save changes" }),
  ).toBeDisabled();
});

test("an expired inbox session revalidates auth and signs back in to the inbox", async ({
  page,
}) => {
  const errors: string[] = [];
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => failedRequests.push(request.url()));
  page.on("pageerror", (error) => errors.push(error.message));
  let recovered = false;
  await page.route("**/api/admin/suggestions**", (route) =>
    route.fulfill({
      status: recovered ? 200 : 401,
      json: recovered
        ? { items: [item], hasMore: false }
        : { error: "Please sign in to continue." },
    }),
  );
  await page.goto("/admin/suggestions");
  await expect(page.getByRole("alert")).toHaveText(
    "Please sign in to continue.",
  );
  // The auth server no longer accepts the session; the mounted provider still has its old user.
  await page.evaluate(() =>
    sessionStorage.setItem("fixture-session-expired", "1"),
  );
  const signIn = page.getByRole("link", {
    name: "Sign in, then return to the inbox",
  });
  await expect(signIn).toHaveAttribute("href", "/account?next=inbox");
  await signIn.click();
  await expect(page).toHaveURL("http://127.0.0.1:3216/account?next=inbox");
  await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "You’re signed in" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      Number(sessionStorage.getItem("fixture-auth-checks")),
    ),
  ).toBe(2);
  await page
    .getByLabel("Email address", { exact: true })
    .fill("owner@example.invalid");
  await page.getByRole("button", { name: "Email me a sign-in code" }).click();
  await page.getByLabel("Verification code").fill("123456");
  recovered = true;
  await page.getByRole("button", { name: "Verify code", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3216/admin/suggestions");
  await expect(
    page.getByRole("button", { name: /Meeting templates/ }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  expect(consoleErrors.filter((message) => !message.includes("401"))).toEqual(
    [],
  );
  expect(failedRequests).toEqual([]);
});
