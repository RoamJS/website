import { z } from "zod";
export const suggestionSchema = z
  .object({
    requestId: z.string().uuid(),
    pluginSlug: z.string().min(1).max(100).nullable(),
    title: z
      .string()
      .trim()
      .min(5, "Give your idea a title of at least 5 characters.")
      .max(140),
    body: z
      .string()
      .trim()
      .min(20, "Add a little more detail (at least 20 characters).")
      .max(5000),
    website: z.string().max(0).optional(),
  })
  .strict();
export const subscriptionSchema = z
  .object({ subscribed: z.boolean() })
  .strict();
export const isSameOrigin = (request: Request): boolean =>
  request.headers.get("origin") === new URL(request.url).origin;
export const verifiedPrimaryEmail = (user: {
  primaryEmailAddressId: string | null;
  emailAddresses: {
    id: string;
    emailAddress: string;
    verification: { status: string } | null;
  }[];
}): string | undefined =>
  user.emailAddresses.find(
    (e) =>
      e.id === user.primaryEmailAddressId &&
      e.verification?.status === "verified",
  )?.emailAddress;
