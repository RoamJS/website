import "server-only";
import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const newsletterSignupSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
    consent: z.literal(true),
    website: z.string().max(0).optional(),
  })
  .strict();
export const newsletterTokenSchema = z
  .object({ token: z.string().min(1).max(200) })
  .strict();
export const hashNewsletterToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");
export const newNewsletterToken = (): string => randomBytes(32).toString("hex");
export const newsletterClientHash = (request: Request): string =>
  createHmac("sha256", process.env.NEWSLETTER_LINK_SECRET!)
    .update(
      request.headers.get("x-vercel-forwarded-for") ??
        "shared-unattributed-client",
    )
    .digest("hex");

export const newsletterRpc = async (
  name: string,
  args: Record<string, string>,
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
  if (error) {
    // Never forward database details, addresses, keys or verification tokens.
    throw new Error(
      error.code === "NL429"
        ? "newsletter-rate-limit"
        : "newsletter-persistence",
    );
  }
  return data;
};

export const newsletterUnsubscribeToken = (id: string): string =>
  `${id}.${createHmac("sha256", process.env.NEWSLETTER_LINK_SECRET!).update(`unsubscribe:${id}`).digest("hex")}`;
export const readNewsletterUnsubscribeToken = (
  token: string,
): string | undefined => {
  const [id, signature, extra] = token.split(".");
  if (
    extra ||
    !z.uuid().safeParse(id).success ||
    !/^[a-f0-9]{64}$/.test(signature ?? "")
  )
    return;
  const expected = newsletterUnsubscribeToken(id).split(".")[1];
  return timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex"),
  )
    ? id
    : undefined;
};

export const newsletterConfirmationEmail = (
  url: string,
): { html: string; text: string } => ({
  html: `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm your RoamJS updates</title></head><body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:auto"><tr><td><img src="https://roamjs.com/email/roamjs-mark.png" width="40" height="48" alt="RoamJS"><h1 style="font-size:26px">Confirm your RoamJS updates</h1><p>You asked for occasional emails about new plugins and useful changes. Confirm below to join the list. No RoamJS account is needed.</p><p style="margin:28px 0"><a href="${url}" style="display:inline-block;background:#0284c7;color:white;padding:14px 20px;border-radius:8px;text-decoration:none">Review and confirm signup</a></p><p>This link expires in 24 hours. You can unsubscribe from any future announcement.</p><p style="font-size:14px;color:#475569">If you didn’t request this, ignore this email. You won’t be subscribed.</p></td></tr></table></td></tr></table></body></html>`,
  text: `Confirm your RoamJS updates\n\nYou asked for occasional emails about new plugins and useful changes. Review and confirm signup: ${url}\n\nThis link expires in 24 hours. No account is needed. You can unsubscribe from future announcements. If you didn’t request this, ignore this email; you won’t be subscribed.`,
});

export const sendNewsletterConfirmation = async ({
  email,
  token,
  requestId,
}: {
  email: string;
  token: string;
  requestId: string;
}): Promise<void> => {
  const url = new URL("/updates/confirm", process.env.NEWSLETTER_SITE_URL!);
  url.searchParams.set("token", token);
  const message = newsletterConfirmationEmail(url.href);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY!}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `newsletter-confirmation/${requestId}`,
    },
    body: JSON.stringify({
      from: "RoamJS <noreply@roamjs.com>",
      to: [email],
      subject: "Confirm your RoamJS updates",
      ...message,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    console.error("newsletter-confirmation-delivery-failed", {
      status: response.status,
    });
    throw new Error("newsletter-delivery");
  }
  if (
    !z.object({ id: z.string().min(1) }).safeParse(await response.json())
      .success
  )
    throw new Error("newsletter-delivery");
};
export const newNewsletterRequestId = (): string => randomUUID();
