import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ rpc: vi.fn(), after: vi.fn() }));
vi.mock("next/server", () => ({ after: state.after }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc: state.rpc }),
}));
import {
  processSuggestionNotifications,
  suggestionNotificationsConfigured,
} from "@/lib/suggestion-notifications";
import { GET } from "@/app/api/cron/suggestion-notifications/route";

const id = "afc3b29d-c4c6-4ab2-8f79-b0cf2bf516dc";
const lease = "a6c3b29d-c4c6-4ab2-8f79-b0cf2bf516dc";
const newJob = {
  suggestion_id: id,
  created_at: new Date(Date.now() - 60_000).toISOString(),
  first_attempt_at: new Date().toISOString(),
  plugin_slug: "smartblocks",
  lease_token: lease,
  attempts: 1,
};
beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  state.rpc.mockReset();
  state.after.mockReset();
  vi.stubEnv("SUGGESTION_NOTIFICATIONS_ENABLED", "true");
  vi.stubEnv("SUGGESTION_NOTIFICATION_TO", "owner@example.test");
  vi.stubEnv(
    "SUGGESTION_NOTIFICATION_START_AT",
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  );
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("SUPABASE_NEWSLETTER_SECRET_KEY", "sb_secret_test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("CRON_SECRET", "cron-test");
  vi.stubEnv("COMMUNITY_SUBMISSIONS_ENABLED", "true");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test");
  state.rpc.mockImplementation(async (name: string) => ({
    data: name === "claim_suggestion_notification" ? newJob : true,
    error: null,
  }));
});

describe("private suggestion notices", () => {
  it("fails closed until all delivery settings are present", () => {
    vi.stubEnv("SUGGESTION_NOTIFICATION_TO", "");
    expect(suggestionNotificationsConfigured()).toBe(false);
  });
  it("sends only a generic owner link with a stable idempotency key", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ id: "email_1" }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    expect(await processSuggestionNotifications({ suggestionId: id })).toBe(1);
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)["Idempotency-Key"]).toBe(
      `suggestion-notification/${id}`,
    );
    const payload = JSON.stringify(JSON.parse(options.body as string));
    expect(payload).toContain("private RoamJS inbox");
    expect(payload).not.toContain("Help me find my notes");
    expect(payload).not.toContain("verified@example.com");
    expect(state.rpc).toHaveBeenCalledWith(
      "finish_suggestion_notification",
      expect.objectContaining({ p_outcome: "sent", p_provider_id: "email_1" }),
    );
  });
  it("skips suggestions saved before notification activation", async () => {
    state.rpc.mockImplementation(async (name: string) => ({
      data:
        name === "claim_suggestion_notification"
          ? {
              ...newJob,
              created_at: new Date(
                Date.now() - 48 * 60 * 60 * 1000,
              ).toISOString(),
            }
          : true,
      error: null,
    }));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await processSuggestionNotifications({ suggestionId: id })).toBe(1);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(state.rpc).toHaveBeenCalledWith(
      "finish_suggestion_notification",
      expect.objectContaining({ p_outcome: "skipped" }),
    );
  });
  it("retries provider outages and does not resend an uncertain attempt after 20 hours", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 503 })),
    );
    await processSuggestionNotifications({ suggestionId: id });
    expect(state.rpc).toHaveBeenCalledWith(
      "finish_suggestion_notification",
      expect.objectContaining({ p_outcome: "retry" }),
    );
    state.rpc.mockClear().mockImplementation(async (name: string) => ({
      data:
        name === "claim_suggestion_notification"
          ? {
              ...newJob,
              created_at: new Date(
                Date.now() - 21 * 60 * 60 * 1000,
              ).toISOString(),
              first_attempt_at: new Date(
                Date.now() - 21 * 60 * 60 * 1000,
              ).toISOString(),
              attempts: 2,
            }
          : true,
      error: null,
    }));
    await processSuggestionNotifications({ suggestionId: id });
    expect(state.rpc).toHaveBeenCalledWith(
      "finish_suggestion_notification",
      expect.objectContaining({ p_outcome: "failed" }),
    );
  });
  it("retries a late first delivery within 20 hours of its first claim", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    state.rpc.mockImplementation(async (name: string) => ({
      data:
        name === "claim_suggestion_notification"
          ? {
              ...newJob,
              created_at: new Date(
                Date.now() - 21 * 60 * 60 * 1000,
              ).toISOString(),
              attempts: 2,
            }
          : true,
      error: null,
    }));
    expect(await processSuggestionNotifications({ suggestionId: id })).toBe(1);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(state.rpc).toHaveBeenCalledWith(
      "finish_suggestion_notification",
      expect.objectContaining({ p_outcome: "retry" }),
    );
  });
  it("rejects unauthenticated cron calls", async () => {
    expect(
      (
        await GET(
          new Request("https://roamjs.com/api/cron/suggestion-notifications"),
        )
      ).status,
    ).toBe(401);
    expect(state.rpc).not.toHaveBeenCalled();
  });
});
