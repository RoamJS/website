import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  sendSuggestionNotification,
  suggestionNotificationsConfigured,
} from "@/lib/suggestion-notifications";

const id = "afc3b29d-c4c6-4ab2-8f79-b0cf2bf516dc";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.stubEnv("SUGGESTION_NOTIFICATIONS_ENABLED", "true");
  vi.stubEnv("SUGGESTION_NOTIFICATION_TO", "owner@example.test");
  vi.stubEnv("RESEND_API_KEY", "re_test");
});

describe("best-effort suggestion email", () => {
  it("fails closed when delivery settings are missing", () => {
    expect(suggestionNotificationsConfigured()).toBe(true);
    vi.stubEnv("SUGGESTION_NOTIFICATION_TO", "");
    expect(suggestionNotificationsConfigured()).toBe(false);
    vi.stubEnv("SUGGESTION_NOTIFICATION_TO", "owner@example.test");
    vi.stubEnv("RESEND_API_KEY", "");
    expect(suggestionNotificationsConfigured()).toBe(false);
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("SUGGESTION_NOTIFICATIONS_ENABLED", "false");
    expect(suggestionNotificationsConfigured()).toBe(false);
  });

  it.each([
    ["smartblocks", "plugin"],
    [null, "app"],
  ])(
    "sends a generic %s notice with a stable idempotency key",
    async (pluginSlug, kind) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(null, { status: 202 }));
      vi.stubGlobal("fetch", fetchMock);
      await sendSuggestionNotification({ id, pluginSlug });
      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.resend.com/emails");
      expect(
        (options.headers as Record<string, string>)["Idempotency-Key"],
      ).toBe(`suggestion-notification/${id}`);
      const payload = JSON.parse(options.body as string) as {
        to: string[];
        text: string;
        html: string;
      };
      expect(payload.to).toEqual(["owner@example.test"]);
      expect(payload.text).toContain(`new ${kind} suggestion`);
      expect(payload.html).toContain("https://roamjs.com/admin/suggestions");
      expect(JSON.stringify(payload)).not.toContain("Help me find my notes");
      expect(JSON.stringify(payload)).not.toContain("verified@example.com");
    },
  );

  it("surfaces a provider failure without attempting another send", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      sendSuggestionNotification({ id, pluginSlug: null }),
    ).rejects.toThrow("suggestion-notification-delivery-failed");
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
