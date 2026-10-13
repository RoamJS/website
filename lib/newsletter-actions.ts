import "server-only";
import { z } from "zod";
import { readSmallJson } from "./community";
import { isSameOrigin } from "./validation";
import { isNewsletterPersistenceConfigured } from "./newsletter-config";
import {
  hashNewsletterToken,
  newsletterRpc,
  newsletterTokenSchema,
  newsletterUnsubscribeToken,
  readNewsletterUnsubscribeToken,
} from "./newsletter";

export const newsletterAction = async ({
  request,
  action,
}: {
  request: Request;
  action: "confirm" | "unsubscribe";
}): Promise<Response> => {
  if (!isNewsletterPersistenceConfigured())
    return Response.json(
      { error: "This service is not available yet." },
      { status: 503 },
    );
  if (!isSameOrigin(request))
    return Response.json(
      { error: "Please open the link on this website and try again." },
      { status: 403 },
    );
  try {
    const parsed = newsletterTokenSchema.safeParse(
      await readSmallJson(request),
    );
    if (!parsed.success)
      return Response.json({ error: "This link is invalid." }, { status: 400 });
    if (action === "unsubscribe") {
      const id = readNewsletterUnsubscribeToken(parsed.data.token);
      if (!id)
        return Response.json(
          { error: "This link is invalid." },
          { status: 400 },
        );
      z.literal(true).parse(
        await newsletterRpc("unsubscribe_newsletter", { p_id: id }),
      );
      return Response.json(
        { message: "You’re unsubscribed from RoamJS updates." },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (!/^[a-f0-9]{64}$/.test(parsed.data.token))
      return Response.json({ error: "This link is invalid." }, { status: 400 });
    const result = await newsletterRpc("confirm_newsletter_signup", {
      p_token_hash: hashNewsletterToken(parsed.data.token),
    });
    const receipt = z.object({ id: z.uuid() }).safeParse(result);
    if (!receipt.success)
      return Response.json(
        {
          error:
            "This link has expired or been replaced. Request a new confirmation from the Updates page.",
        },
        { status: 400 },
      );
    return Response.json(
      {
        message: "You’re subscribed to RoamJS updates.",
        unsubscribeToken: newsletterUnsubscribeToken(receipt.data.id),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "We couldn’t save your choice. Please try again." },
      { status: 503 },
    );
  }
};
