import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ getUser: vi.fn(), sql: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: state.getUser } }),
}));
vi.mock("@neondatabase/serverless", () => ({ neon: () => state.sql }));
import { POST as suggest } from "@/app/api/suggestions/route";
import { POST as subscribe } from "@/app/api/subscriptions/route";
const valid = {
  requestId: "df864027-d036-4e2f-a963-2c135ff66adb",
  pluginSlug: "smartblocks",
  title: "A useful idea",
  body: "Help me find my notes across projects.",
};
const request = (data: unknown): Request =>
  new Request("https://roamjs.com/api/suggestions", {
    method: "POST",
    headers: {
      origin: "https://roamjs.com",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "test");
  vi.stubEnv("DATABASE_URL", "test");
  state.sql.mockReset().mockResolvedValue([{ id: 1, attempts: 1 }]);
  vi.stubEnv("COMMUNITY_SUBMISSIONS_ENABLED", "true");
  vi.stubEnv("NEWSLETTER_SIGNUP_ENABLED", "true");
  state.getUser.mockReset().mockResolvedValue({
    data: {
      user: {
        id: "user_1",
        email: "verified@example.com",
        email_confirmed_at: "2026-10-06T00:00:00Z",
      },
    },
    error: null,
  });
});
describe("community API", () => {
  it("fails closed when services are not configured", async () => {
    vi.stubEnv("DATABASE_URL", "");
    expect((await suggest(request(valid))).status).toBe(503);
    expect(state.sql).not.toHaveBeenCalled();
  });
  it("keeps persistence disabled until explicitly enabled", async () => {
    vi.stubEnv("COMMUNITY_SUBMISSIONS_ENABLED", "false");
    expect((await suggest(request(valid))).status).toBe(503);
    expect(state.sql).not.toHaveBeenCalled();
  });
  it.each([
    ["true", undefined, 201, 503],
    ["true", "false", 201, 503],
    ["false", "true", 503, 200],
    [undefined, undefined, 503, 503],
  ])(
    "keeps suggestion %s and newsletter %s writes independent",
    async (suggestions, newsletter, suggestionStatus, newsletterStatus) => {
      vi.stubEnv("COMMUNITY_SUBMISSIONS_ENABLED", suggestions);
      vi.stubEnv("NEWSLETTER_SIGNUP_ENABLED", newsletter);
      expect((await suggest(request(valid))).status).toBe(suggestionStatus);
      if (suggestionStatus === 503) expect(state.sql).not.toHaveBeenCalled();
      state.sql.mockClear();
      expect((await subscribe(request({ subscribed: true }))).status).toBe(
        newsletterStatus,
      );
      if (newsletterStatus === 503) expect(state.sql).not.toHaveBeenCalled();
      else
        expect(state.sql.mock.calls[1][0].join("")).toContain(
          "INSERT INTO subscriptions",
        );
    },
  );
  it("requires a session", async () => {
    state.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await suggest(request(valid))).status).toBe(401);
    expect(state.sql).not.toHaveBeenCalled();
  });
  it("requires a verified primary email", async () => {
    state.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user_1",
          email: "unverified@example.com",
          user_metadata: { email_verified: true },
        },
      },
      error: null,
    });
    expect((await suggest(request(valid))).status).toBe(403);
  });
  it.each(["", "   ", "unknown"])(
    "rejects invalid plugin slug %j before writing",
    async (pluginSlug) => {
      expect((await suggest(request({ ...valid, pluginSlug }))).status).toBe(
        400,
      );
      expect(state.sql).not.toHaveBeenCalled();
    },
  );
  it("stores general suggestions with a null plugin slug", async () => {
    expect(
      (await suggest(request({ ...valid, pluginSlug: null }))).status,
    ).toBe(201);
    expect(state.sql.mock.calls[1][4]).toBeNull();
  });
  it.each([{ title: "ab👍c" }, { body: "x".repeat(18) + "👍" }])(
    "rejects short Unicode text before consuming rate limits: %j",
    async (patch) => {
      expect((await suggest(request({ ...valid, ...patch }))).status).toBe(400);
      expect(state.sql).not.toHaveBeenCalled();
    },
  );
  it("accepts Unicode text at the database minimum", async () => {
    expect(
      (
        await suggest(
          request({ ...valid, title: "ab👍cd", body: "x".repeat(19) + "👍" }),
        )
      ).status,
    ).toBe(201);
    expect(state.sql).toHaveBeenCalledTimes(2);
  });
  it("uses server identity and never subscribes an idea author", async () => {
    expect((await suggest(request(valid))).status).toBe(201);
    expect(state.sql.mock.calls[1].slice(1)).toContain("verified@example.com");
    expect(
      state.sql.mock.calls.map((c) => c[0].join("")).join(""),
    ).not.toContain("INSERT INTO subscriptions");
  });
  it("rate limits writes across requests", async () => {
    state.sql.mockResolvedValue([]);
    expect((await suggest(request(valid))).status).toBe(429);
    expect(state.sql).toHaveBeenCalledTimes(1);
  });
  it("returns an error when persistence fails", async () => {
    state.sql.mockRejectedValue(new Error("DB unavailable"));
    expect((await suggest(request(valid))).status).toBe(503);
  });
  it("allows an opt-out without consuming the submission limit", async () => {
    expect((await subscribe(request({ subscribed: false }))).status).toBe(200);
    expect(state.sql).toHaveBeenCalledTimes(1);
    expect(state.sql.mock.calls[0][0].join("")).toContain(
      "INSERT INTO subscriptions",
    );
  });
  it("rejects excessively large bodies", async () => {
    expect(
      (await suggest(request({ ...valid, body: "x".repeat(25000) }))).status,
    ).toBe(400);
    expect(state.sql).not.toHaveBeenCalled();
  });
});
