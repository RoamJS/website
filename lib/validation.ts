import { z } from "zod";
export const suggestionSchema = z
  .object({
    requestId: z.string().uuid(),
    pluginSlug: z.string().min(1).max(100).nullable(),
    title: z
      .string()
      .trim()
      .refine(
        (value) => Array.from(value).length >= 5,
        "Give your idea a title of at least 5 characters.",
      )
      .refine(
        (value) => Array.from(value).length <= 140,
        "Keep your title to 140 characters or fewer.",
      ),
    body: z
      .string()
      .trim()
      .refine(
        (value) => Array.from(value).length >= 20,
        "Add a little more detail (at least 20 characters).",
      )
      .refine(
        (value) => Array.from(value).length <= 5000,
        "Keep your idea to 5000 characters or fewer.",
      ),
    website: z.string().max(0).optional(),
  })
  .strict();
export const isSameOrigin = (request: Request): boolean =>
  request.headers.get("origin") === new URL(request.url).origin;
export const verifiedPrimaryEmail = (user: {
  email?: string;
  email_confirmed_at?: string;
  is_anonymous?: boolean;
}): string | undefined =>
  !user.is_anonymous && user.email_confirmed_at ? user.email : undefined;
