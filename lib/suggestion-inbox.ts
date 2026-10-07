import { z } from "zod";
export const reviewStatuses = [
  "new",
  "reviewing",
  "planned",
  "completed",
] as const;
export const reviewUpdateSchema = z
  .object({
    id: z.string().uuid(),
    version: z.number().int().positive(),
    status: z.enum(reviewStatuses),
    note: z.string().refine((value) => Array.from(value).length <= 2000),
    recordFollowUp: z.boolean(),
  })
  .strict();
export const reviewReceiptSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(reviewStatuses),
  follow_up_note: z.string(),
  followed_up_at: z.string().nullable(),
  updated_at: z.string(),
  version: z.number().int().positive(),
});
export const inboxItemSchema = reviewReceiptSchema.extend({
  email: z.string().email(),
  plugin_slug: z.string().nullable(),
  title: z.string(),
  body: z.string(),
  created_at: z.string(),
});
export const inboxSchema = z.object({
  items: z.array(inboxItemSchema).max(26),
});
export type InboxItem = z.infer<typeof inboxItemSchema>;
export const replyLink = (item: Pick<InboxItem, "email" | "title">): string =>
  `mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent(`Re: Your RoamJS idea — ${item.title.replace(/[\r\n]/g, " ")}`)}`;
