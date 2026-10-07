import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: state.getUser }, rpc: state.rpc }),
}));
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
  state.rpc.mockReset().mockResolvedValue({
    data: { id: "afc3b29d-c4c6-4ab2-8f79-b0cf2bf516dc", duplicate: false },
    error: null,
  });
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
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect((await suggest(request(valid))).status).toBe(503);
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("keeps persistence disabled until explicitly enabled", async () => {
    vi.stubEnv("COMMUNITY_SUBMISSIONS_ENABLED", "false");
    expect((await suggest(request(valid))).status).toBe(503);
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it.each([
    ["true", undefined, 201, 503],
    ["true", "false", 201, 503],
    ["true", "true", 201, 503],
    ["false", "true", 503, 503],
    [undefined, undefined, 503, 503],
  ])(
    "keeps suggestion %s and newsletter %s writes independent",
    async (suggestions, newsletter, suggestionStatus, newsletterStatus) => {
      vi.stubEnv("COMMUNITY_SUBMISSIONS_ENABLED", suggestions);
      vi.stubEnv("NEWSLETTER_SIGNUP_ENABLED", newsletter);
      expect((await suggest(request(valid))).status).toBe(suggestionStatus);
      if (suggestionStatus === 503) expect(state.rpc).not.toHaveBeenCalled();
      state.rpc.mockClear().mockResolvedValue({ data: true, error: null });
      expect((await subscribe()).status).toBe(newsletterStatus);
      expect(state.rpc).not.toHaveBeenCalled();
    },
  );
  it("requires a session", async () => {
    state.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await suggest(request(valid))).status).toBe(401);
    expect(state.rpc).not.toHaveBeenCalled();
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
      expect(state.rpc).not.toHaveBeenCalled();
    },
  );
  it("stores general suggestions with a null plugin slug", async () => {
    expect(
      (await suggest(request({ ...valid, pluginSlug: null }))).status,
    ).toBe(201);
    expect(state.rpc.mock.calls[0][1].p_plugin_slug).toBeNull();
  });
  it.each([{ title: "ab👍c" }, { body: "x".repeat(18) + "👍" }])(
    "rejects short Unicode text before consuming rate limits: %j",
    async (patch) => {
      expect((await suggest(request({ ...valid, ...patch }))).status).toBe(400);
      expect(state.rpc).not.toHaveBeenCalled();
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
    expect(state.rpc).toHaveBeenCalledTimes(1);
  });
  it("uses server identity and never subscribes an idea author", async () => {
    expect((await suggest(request(valid))).status).toBe(201);
    expect(state.getUser).toHaveBeenCalled();
    expect(state.rpc).toHaveBeenCalledWith("submit_suggestion", {
      p_request_id: valid.requestId,
      p_plugin_slug: valid.pluginSlug,
      p_title: valid.title,
      p_body: valid.body,
    });
    expect(state.rpc).toHaveBeenCalledTimes(1);
  });
  it("rate limits writes across requests", async () => {
    state.rpc.mockResolvedValue({ data: null, error: { code: "RW429" } });
    expect((await suggest(request(valid))).status).toBe(429);
    expect(state.rpc).toHaveBeenCalledTimes(1);
  });
  it("returns an error when persistence fails", async () => {
    state.rpc.mockRejectedValue(new Error("DB unavailable"));
    expect((await suggest(request(valid))).status).toBe(503);
  });
  it("retries return the saved id without inventing a new success", async () => {
    state.rpc.mockResolvedValue({
      data: { id: "afc3b29d-c4c6-4ab2-8f79-b0cf2bf516dc", duplicate: true },
      error: null,
    });
    const response = await suggest(request(valid));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: "afc3b29d-c4c6-4ab2-8f79-b0cf2bf516dc",
    });
  });
  it.each([null, {}, { id: "", duplicate: false }])(
    "never reports success without a persisted receipt: %j",
    async (data) => {
      state.rpc.mockResolvedValue({ data, error: null });
      expect((await suggest(request(valid))).status).toBe(503);
    },
  );
  it("rejects changed content reusing a request id", async () => {
    state.rpc.mockResolvedValue({ data: null, error: { code: "RW409" } });
    expect((await suggest(request(valid))).status).toBe(409);
  });
  it("keeps newsletter unavailable even with old configuration and no session", async () => {
    vi.stubEnv("DATABASE_URL", "obsolete");
    vi.stubEnv("NEWSLETTER_SIGNUP_ENABLED", "true");
    state.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await subscribe();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Newsletter signup is not open yet.",
    });
    expect(state.getUser).not.toHaveBeenCalled();
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("rejects excessively large bodies", async () => {
    expect(
      (await suggest(request({ ...valid, body: "x".repeat(25000) }))).status,
    ).toBe(400);
    expect(state.rpc).not.toHaveBeenCalled();
  });
});
