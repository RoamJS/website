import "server-only";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const jobSchema = z.object({
  suggestion_id: z.uuid(),
  created_at: z.iso.datetime({ offset: true }),
  first_attempt_at: z.iso.datetime({ offset: true }),
  plugin_slug: z.string().nullable(),
  lease_token: z.uuid(),
  attempts: z.number().int().min(1),
});

type NotificationOutcome = "sent" | "retry" | "failed" | "skipped";

export const suggestionNotificationsConfigured = (): boolean =>
  process.env.SUGGESTION_NOTIFICATIONS_ENABLED === "true" &&
  Boolean(
    z.email().safeParse(process.env.SUGGESTION_NOTIFICATION_TO).success,
  ) &&
  Boolean(process.env.RESEND_API_KEY?.startsWith("re_")) &&
  Boolean(
    process.env.SUPABASE_NEWSLETTER_SECRET_KEY?.startsWith("sb_secret_"),
  ) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(
    process.env.SUGGESTION_NOTIFICATION_START_AT &&
    !Number.isNaN(Date.parse(process.env.SUGGESTION_NOTIFICATION_START_AT)),
  );

const notificationRpc = async (
  name: string,
  args: Record<string, string | null>,
): Promise<unknown> => {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_NEWSLETTER_SECRET_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error("suggestion-notification-database");
  return data;
};

const finishNotification = async ({
  id,
  leaseToken,
  outcome,
  providerId = null,
}: {
  id: string;
  leaseToken: string;
  outcome: NotificationOutcome;
  providerId?: string | null;
}): Promise<void> => {
  const done = await notificationRpc("finish_suggestion_notification", {
    p_suggestion_id: id,
    p_lease_token: leaseToken,
    p_outcome: outcome,
    p_provider_id: providerId,
  });
  if (done !== true) throw new Error("suggestion-notification-lease-lost");
};

const sendNotification = async ({
  id,
  pluginSlug,
}: {
  id: string;
  pluginSlug: string | null;
}): Promise<{ outcome: NotificationOutcome; providerId?: string }> => {
  const kind = pluginSlug ? "plugin" : "app";
  const url = "https://roamjs.com/admin/suggestions";
  try {
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
    if (!response.ok)
      return {
        outcome:
          response.status === 429 || response.status >= 500
            ? "retry"
            : "failed",
      };
    const parsed = z
      .object({ id: z.string().min(1) })
      .safeParse(await response.json());
    if (!parsed.success) return { outcome: "retry" };
    return { outcome: "sent", providerId: parsed.data.id };
  } catch {
    return { outcome: "retry" };
  }
};

export const processSuggestionNotifications = async ({
  suggestionId = null,
  limit = 1,
}: {
  suggestionId?: string | null;
  limit?: number;
} = {}): Promise<number> => {
  if (!suggestionNotificationsConfigured()) return 0;
  const activationAt = Date.parse(
    process.env.SUGGESTION_NOTIFICATION_START_AT!,
  );
  let processed = 0;
  for (let i = 0; i < limit; i += 1) {
    const raw = await notificationRpc("claim_suggestion_notification", {
      p_suggestion_id: suggestionId,
    });
    if (raw === null) break;
    const job = jobSchema.parse(raw);
    const outcome =
      Date.parse(job.created_at) < activationAt
        ? { outcome: "skipped" as const }
        : job.attempts > 1 &&
            Date.now() - Date.parse(job.first_attempt_at) >= 20 * 60 * 60 * 1000
          ? { outcome: "failed" as const }
          : await sendNotification({
              id: job.suggestion_id,
              pluginSlug: job.plugin_slug,
            });
    await finishNotification({
      id: job.suggestion_id,
      leaseToken: job.lease_token,
      outcome: outcome.outcome,
      providerId: "providerId" in outcome ? outcome.providerId : undefined,
    });
    processed += 1;
    if (suggestionId) break;
  }
  return processed;
};
