import { describe, expect, it } from "vitest";
import {
  cleanAnalyticsUrl,
  isPublicAnalyticsPath,
  sanitizeAnalyticsEvent,
} from "@/lib/analytics-privacy";

describe("analytics privacy boundary", () => {
  it("allows public pages but excludes OAuth, APIs, and unexpected routes", () => {
    for (const path of ["/", "/plugins/breadcrumbs", "/ideas", "/privacy"])
      expect(isPublicAnalyticsPath(path)).toBe(true);
    for (const path of [
      "/oauth",
      "/oauth/session",
      "/google-auth",
      "/api/suggestions",
      "/sign-in",
      "/unknown",
    ])
      expect(isPublicAnalyticsPath(path)).toBe(false);
  });
  it("removes URL credentials, queries and fragments", () => {
    expect(
      cleanAnalyticsUrl(
        "https://name:password@example.com/plugins/stats?email=secret#token",
      ),
    ).toBe("https://example.com/plugins/stats");
    expect(cleanAnalyticsUrl("mailto:private@example.com")).toBe("");
  });
  it("scrubs page and referrer queries and person properties without losing event dimensions", () => {
    const result = sanitizeAnalyticsEvent({
      uuid: "test",
      event: "plugin clicked",
      $set: { email: "private@example.com" },
      properties: {
        $current_url: "https://roamjs.com/plugins/stats?code=secret#token",
        $referrer: "https://example.com/?search=private",
        $prev_pageview_url: "https://roamjs.com/?email=private",
        $initial_current_url: "https://roamjs.com/?secret",
        $set_once: { email: "private@example.com" },
        utm_source: "private",
        plugin_slug: "stats",
        source: "featured",
      },
    });
    expect(result?.properties).toEqual({
      $current_url: "https://roamjs.com/plugins/stats",
      $referrer: "https://example.com/",
      $prev_pageview_url: "https://roamjs.com/",
      plugin_slug: "stats",
      source: "featured",
    });
    expect(result?.$set).toBeUndefined();
  });
  it("drops events from credential-bearing routes", () => {
    expect(
      sanitizeAnalyticsEvent({
        uuid: "test",
        event: "$pageview",
        properties: { $current_url: "https://roamjs.com/oauth?code=secret" },
      }),
    ).toBeNull();
    expect(sanitizeAnalyticsEvent(null)).toBeNull();
  });
});
