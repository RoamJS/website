import { describe, expect, it } from "vitest";
import {
  isSameOrigin,
  suggestionSchema,
  subscriptionSchema,
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
  it("requires an explicit subscription boolean", () => {
    expect(subscriptionSchema.safeParse({}).success).toBe(false);
    expect(subscriptionSchema.safeParse({ subscribed: "yes" }).success).toBe(
      false,
    );
    expect(subscriptionSchema.safeParse({ subscribed: false }).success).toBe(
      true,
    );
  });
  it("accepts only a verified primary email", () => {
    const emailAddresses = [
      {
        id: "a",
        emailAddress: "a@example.com",
        verification: { status: "unverified" },
      },
      {
        id: "b",
        emailAddress: "b@example.com",
        verification: { status: "verified" },
      },
    ];
    expect(
      verifiedPrimaryEmail({ primaryEmailAddressId: "a", emailAddresses }),
    ).toBeUndefined();
    expect(
      verifiedPrimaryEmail({ primaryEmailAddressId: "b", emailAddresses }),
    ).toBe("b@example.com");
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
