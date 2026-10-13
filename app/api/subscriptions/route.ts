import { z } from "zod";
import { after } from "next/server";
import { readSmallJson } from "@/lib/community";
import { isSameOrigin } from "@/lib/validation";
import { isNewsletterSignupConfigured } from "@/lib/newsletter-config";
import {
  hashNewsletterToken,
  newNewsletterToken,
  newNewsletterRequestId,
  newsletterClientHash,
  newsletterRpc,
  newsletterSignupSchema,
  sendNewsletterConfirmation,
} from "@/lib/newsletter";

export const POST = async (request: Request): Promise<Response> => {
  if (!isNewsletterSignupConfigured())
    return Response.json(
      { error: "Newsletter signup is not open yet." },
      { status: 503 },
    );
  if (!isSameOrigin(request))
    return Response.json(
      { error: "Please reload this page and try again." },
      { status: 403 },
    );
  let body: unknown;
  try {
    body = await readSmallJson(request);
  } catch {
    return Response.json(
      { error: "Please check the form and try again." },
      { status: 400 },
    );
  }
  try {
    const parsed = newsletterSignupSchema.safeParse(body);
    if (!parsed.success)
      return Response.json(
        { error: "Enter a valid email and choose to receive RoamJS updates." },
        { status: 400 },
      );
    const token = newNewsletterToken();
    const requestId = newNewsletterRequestId();
    const receipt = z.object({ send: z.boolean() }).parse(
      await newsletterRpc("request_newsletter_signup", {
        p_email: parsed.data.email,
        p_token_hash: hashNewsletterToken(token),
        p_request_id: requestId,
        p_client_hash: newsletterClientHash(request),
      }),
    );
    if (receipt.send) {
      after(async () => {
        try {
          await sendNewsletterConfirmation({
            email: parsed.data.email,
            token,
            requestId,
          });
        } catch {
          try {
            // Keep the token valid if delivery succeeded but its response was lost.
            await newsletterRpc("release_failed_newsletter_delivery", {
              p_request_id: requestId,
            });
          } catch {
            console.error("newsletter-confirmation-retry-release-failed");
          }
        }
      });
    }
    // Provider latency must not reveal whether this address needs an email.
    return Response.json(
      {
        message:
          "If confirmation is needed, an email should arrive shortly. If it doesn’t, try again in a minute.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof SyntaxError)
      return Response.json(
        { error: "Please check the form and try again." },
        { status: 400 },
      );
    const limited =
      error instanceof Error && error.message === "newsletter-rate-limit";
    return Response.json(
      {
        error: limited
          ? "Please wait before requesting another email."
          : "We couldn’t confirm your signup request. Please try again shortly.",
      },
      { status: limited ? 429 : 503, headers: { "Cache-Control": "no-store" } },
    );
  }
};
