import "server-only";
import { z } from "zod";

export const suggestionNotificationsConfigured = (): boolean =>
  process.env.SUGGESTION_NOTIFICATIONS_ENABLED === "true" &&
  z.email().safeParse(process.env.SUGGESTION_NOTIFICATION_TO).success &&
  Boolean(process.env.RESEND_API_KEY?.startsWith("re_"));

export const sendSuggestionNotification = async ({
  id,
  pluginSlug,
}: {
  id: string;
  pluginSlug: string | null;
}): Promise<void> => {
  const kind = pluginSlug ? "plugin" : "app";
  const url = "https://roamjs.com/admin/suggestions";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY!}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `suggestion-notification/${id}`,
    },
    body: JSON.stringify({
      from: "RoamJS <noreply@roamjs.com>",
      to: [process.env.SUGGESTION_NOTIFICATION_TO],
      subject: "New RoamJS suggestion",
      text: `A new ${kind} suggestion is waiting in your private RoamJS inbox.\n\nReview it: ${url}`,
      html: `<p>A new ${kind} suggestion is waiting in your private RoamJS inbox.</p><p><a href="${url}">Review suggestion</a></p>`,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("suggestion-notification-delivery-failed");
};
