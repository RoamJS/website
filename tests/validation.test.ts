import { describe, expect, it } from "vitest";
import {
  isSameOrigin,
  suggestionSchema,
  verifiedPrimaryEmail,
} from "@/lib/validation";
const valid = {
  requestId: "df864027-d036-4e2f-a963-2c135ff66adb",
  pluginSlug: null,
  title: "A useful idea",
  body: "Help me find my notes across projects.",
};
describe("submission boundaries", () => {
  it("accepts bounded ideas but never client-supplied identity", () => {
    expect(suggestionSchema.safeParse(valid).success).toBe(true);
    expect(
      suggestionSchema.safeParse({ ...valid, email: "spoof@example.com" })
        .success,
    ).toBe(false);
  });
  it("rejects empty, oversized, and bot-filled submissions", () => {
    for (const patch of [
      { title: "   " },
      { pluginSlug: "" },
      { body: "x".repeat(5001) },
      { website: "spam" },
      { requestId: "bad" },
    ])
      expect(suggestionSchema.safeParse({ ...valid, ...patch }).success).toBe(
        false,
      );
  });
  it("counts Unicode code points like the database for title and body limits", () => {
    for (const patch of [
      { title: "ab👍c" },
      { body: "x".repeat(18) + "👍" },
      { title: "👍".repeat(141) },
      { body: "👍".repeat(5001) },
    ]) {
      expect(suggestionSchema.safeParse({ ...valid, ...patch }).success).toBe(
        false,
      );
    }
    for (const patch of [
      { title: "ab👍cd" },
      { body: "x".repeat(19) + "👍" },
      { title: "👍".repeat(140) },
      { body: "👍".repeat(5000) },
    ]) {
      expect(suggestionSchema.safeParse({ ...valid, ...patch }).success).toBe(
        true,
      );
    }
  });
  it("accepts only a confirmed, non-anonymous Supabase email", () => {
    const verified = {
      email: "a@example.com",
      email_confirmed_at: "2026-10-06T00:00:00Z",
    };
    expect(verifiedPrimaryEmail(verified)).toBe("a@example.com");
    expect(verifiedPrimaryEmail({ email: verified.email })).toBeUndefined();
    expect(
      verifiedPrimaryEmail({ ...verified, is_anonymous: true }),
    ).toBeUndefined();
    expect(
      verifiedPrimaryEmail({ email_confirmed_at: verified.email_confirmed_at }),
    ).toBeUndefined();
  });
  it("rejects cross-origin and missing-origin mutations", () => {
    expect(
      isSameOrigin(
        new Request("https://roamjs.com/api/suggestions", {
          headers: { origin: "https://roamjs.com" },
        }),
      ),
    ).toBe(true);
    expect(
      isSameOrigin(
        new Request("https://roamjs.com/api/suggestions", {
          headers: { origin: "https://evil.example" },
        }),
      ),
    ).toBe(false);
    expect(
      isSameOrigin(new Request("https://roamjs.com/api/suggestions")),
    ).toBe(false);
  });
});
