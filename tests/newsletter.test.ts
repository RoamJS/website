import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc: state.rpc }),
}));
import { POST as signup } from "@/app/api/subscriptions/route";
import { POST as confirm } from "@/app/api/subscriptions/confirm/route";
import { POST as unsubscribe } from "@/app/api/subscriptions/unsubscribe/route";
import {
  hashNewsletterToken,
  newsletterUnsubscribeToken,
  readNewsletterUnsubscribeToken,
  newsletterConfirmationEmail,
} from "@/lib/newsletter";
const id = "89c79d39-3b92-4fbd-9f99-53b1b59d7e92";
const request = (
  path: string,
  body: unknown,
  origin = "https://roamjs.com",
): Request =>
  new Request(`https://roamjs.com${path}`, {
    method: "POST",
    headers: {
      origin,
      "Content-Type": "application/json",
      "x-vercel-forwarded-for": "192.0.2.5",
    },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_NEWSLETTER_SECRET_KEY", "sb_secret_fixture");
  vi.stubEnv(
    "NEWSLETTER_LINK_SECRET",
    "test-only-secret-with-at-least-32-characters",
  );
  vi.stubEnv("NEWSLETTER_SITE_URL", "https://roamjs.com");
  vi.stubEnv("NEWSLETTER_SIGNUP_ENABLED", "true");
  vi.stubEnv("RESEND_API_KEY", "fixture-not-a-real-api-key");
  state.rpc
    .mockReset()
    .mockResolvedValue({ data: { send: true }, error: null });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ id: "fixture-delivery" })),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("independent email-only signup", () => {
  it("works without a session, requires consent, hashes tokens and keeps email out of receipts", async () => {
    const response = await signup(
      request("/api/subscriptions", {
        email: "  PERSON@example.invalid  ",
        consent: true,
      }),
    );
    expect(response.status).toBe(200);
    expect(JSON.stringify(await response.json())).not.toContain(
      "person@example.invalid",
    );
    const args = state.rpc.mock.calls[0][1];
    expect(args.p_email).toBe("person@example.invalid");
    expect(args.p_client_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(args)).not.toContain("192.0.2.5");
    const options = vi.mocked(fetch).mock.calls[0][1]!;
    const sent = JSON.parse(options.body as string);
    const token = new URL(sent.text.match(/https:\/\/\S+/)[0]).searchParams.get(
      "token",
    )!;
    expect(args.p_token_hash).toBe(hashNewsletterToken(token));
    expect(JSON.stringify(args)).not.toContain(token);
    expect(sent.from).toBe("RoamJS <noreply@roamjs.com>");
    expect(
      (options.headers as Record<string, string>)["Idempotency-Key"],
    ).toMatch(/^newsletter-confirmation\//);
  });
  it.each([
    { email: "test@example.invalid", consent: false },
    { email: "test@example.invalid" },
    { email: "not-email", consent: true },
    { email: "test@example.invalid", consent: true, website: "spam" },
  ])("rejects unconsented or invalid input: %j", async (body) => {
    expect((await signup(request("/api/subscriptions", body))).status).toBe(
      400,
    );
    expect(state.rpc).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("blocks other origins before sending", async () => {
    expect(
      (
        await signup(
          request(
            "/api/subscriptions",
            { email: "test@example.invalid", consent: true },
            "https://other.invalid",
          ),
        )
      ).status,
    ).toBe(403);
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("requires every secret, origin and explicit activation flag", async () => {
    vi.stubEnv("NEWSLETTER_SIGNUP_ENABLED", "false");
    expect((await signup(request("/api/subscriptions", {}))).status).toBe(503);
    vi.stubEnv("NEWSLETTER_SIGNUP_ENABLED", "true");
    vi.stubEnv("SUPABASE_NEWSLETTER_SECRET_KEY", "sb_publishable_fixture");
    expect((await signup(request("/api/subscriptions", {}))).status).toBe(503);
    vi.stubEnv("SUPABASE_NEWSLETTER_SECRET_KEY", "sb_secret_fixture");
    vi.stubEnv("NEWSLETTER_SITE_URL", "http://unsafe.invalid");
    expect((await signup(request("/api/subscriptions", {}))).status).toBe(503);
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("does not email an existing subscriber or one in cooldown", async () => {
    state.rpc.mockResolvedValue({ data: { send: false }, error: null });
    expect(
      (
        await signup(
          request("/api/subscriptions", {
            email: "test@example.invalid",
            consent: true,
          }),
        )
      ).status,
    ).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
    expect(state.rpc).toHaveBeenCalledTimes(1);
  });
  it("fails honestly on quota, missing receipt or ambiguous provider delivery", async () => {
    state.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "NL429", message: "private details" },
    });
    expect(
      (
        await signup(
          request("/api/subscriptions", {
            email: "test@example.invalid",
            consent: true,
          }),
        )
      ).status,
    ).toBe(429);
    state.rpc.mockResolvedValueOnce({ data: null, error: null });
    expect(
      (
        await signup(
          request("/api/subscriptions", {
            email: "test@example.invalid",
            consent: true,
          }),
        )
      ).status,
    ).toBe(503);
    vi.mocked(fetch).mockRejectedValueOnce(
      new Error("provider contains secret"),
    );
    const response = await signup(
      request("/api/subscriptions", {
        email: "test@example.invalid",
        consent: true,
      }),
    );
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("secret");
    expect(state.rpc).toHaveBeenLastCalledWith(
      "release_failed_newsletter_delivery",
      { p_request_id: expect.any(String) },
    );
  });
  it("records only the provider status while keeping private details out of logs and responses", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      vi.mocked(fetch).mockResolvedValueOnce(
        Response.json(
          {
            message: "private-provider-details",
            recipient: "test@example.invalid",
          },
          { status: 401 },
        ),
      );
      const response = await signup(
        request("/api/subscriptions", {
          email: "test@example.invalid",
          consent: true,
        }),
      );
      expect(response.status).toBe(503);
      expect(state.rpc).toHaveBeenLastCalledWith(
        "release_failed_newsletter_delivery",
        { p_request_id: expect.any(String) },
      );
      expect(log).toHaveBeenCalledExactlyOnceWith(
        "newsletter-confirmation-delivery-failed",
        { status: 401 },
      );
      const visible = JSON.stringify([log.mock.calls, await response.json()]);
      expect(visible).not.toContain("private-provider-details");
      expect(visible).not.toContain("test@example.invalid");
      expect(visible).not.toContain("fixture-not-a-real-api-key");
    } finally {
      log.mockRestore();
    }
  });
  it("rejects oversized bodies without persistence", async () => {
    expect(
      (
        await signup(
          request("/api/subscriptions", {
            email: "x".repeat(25000),
            consent: true,
          }),
        )
      ).status,
    ).toBe(400);
    expect(state.rpc).not.toHaveBeenCalled();
  });
});
describe("confirmation and opt-out", () => {
  it("confirms only a persisted receipt and provides a signed unsubscribe link", async () => {
    state.rpc.mockResolvedValue({ data: { id }, error: null });
    const token = "a".repeat(64);
    const response = await confirm(
      request("/api/subscriptions/confirm", { token }),
    );
    expect(response.status).toBe(200);
    expect(state.rpc).toHaveBeenCalledWith("confirm_newsletter_signup", {
      p_token_hash: hashNewsletterToken(token),
    });
    expect(
      readNewsletterUnsubscribeToken((await response.json()).unsubscribeToken),
    ).toBe(id);
    expect(fetch).not.toHaveBeenCalled();
    state.rpc.mockResolvedValue({ data: null, error: null });
    expect(
      (await confirm(request("/api/subscriptions/confirm", { token }))).status,
    ).toBe(400);
  });
  it("refuses forged opt-out tokens and still permits real opt-out when signup is paused", async () => {
    const token = newsletterUnsubscribeToken(id);
    expect(
      (
        await unsubscribe(
          request("/api/subscriptions/unsubscribe", {
            token: `${id}.${"0".repeat(64)}`,
          }),
        )
      ).status,
    ).toBe(400);
    expect(state.rpc).not.toHaveBeenCalled();
    vi.stubEnv("NEWSLETTER_SIGNUP_ENABLED", "false");
    vi.stubEnv("RESEND_API_KEY", "");
    state.rpc.mockResolvedValue({ data: true, error: null });
    expect(
      (await unsubscribe(request("/api/subscriptions/unsubscribe", { token })))
        .status,
    ).toBe(200);
    expect(state.rpc).toHaveBeenCalledWith("unsubscribe_newsletter", {
      p_id: id,
    });
  });
  it("requires the website origin for consent changes", async () => {
    expect(
      (
        await confirm(
          request(
            "/api/subscriptions/confirm",
            { token: "a".repeat(64) },
            "https://other.invalid",
          ),
        )
      ).status,
    ).toBe(403);
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("sends recognizable requested-only HTML and plain text", () => {
    const email = newsletterConfirmationEmail(
      "https://roamjs.com/updates/confirm?token=fixture",
    );
    expect(email.html).toContain('alt="RoamJS"');
    expect(email.text).toContain("24 hours");
    expect(email.text).toContain("won’t be subscribed");
    expect(email.html).not.toContain("<script");
  });
});
