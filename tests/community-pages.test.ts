import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/components/community-form", () => ({
  CommunityForm: ({ enabled, kind }: { enabled: boolean; kind: string }) =>
    createElement(
      "div",
      null,
      `${kind}: ${enabled ? "available" : "unavailable"}`,
    ),
}));
import Ideas from "@/app/ideas/page";
import Updates from "@/app/updates/page";
afterEach(() => vi.unstubAllEnvs());
describe("independent community page availability", () => {
  it.each([
    ["true", undefined, "available", "unavailable"],
    ["false", "true", "unavailable", "available"],
    [undefined, undefined, "unavailable", "unavailable"],
  ])(
    "suggestions %s and newsletter %s show only their enabled forms",
    (suggestions, newsletter, ideaState, newsletterState) => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test");
      vi.stubEnv("DATABASE_URL", "test");
      vi.stubEnv("COMMUNITY_SUBMISSIONS_ENABLED", suggestions);
      vi.stubEnv("NEWSLETTER_SIGNUP_ENABLED", newsletter);
      expect(renderToStaticMarkup(createElement(Ideas))).toContain(
        `idea: ${ideaState}`,
      );
      expect(renderToStaticMarkup(createElement(Updates))).toContain(
        `subscription: ${newsletterState}`,
      );
    },
  );
});
