import {
  authorizeSubmission,
  consumeRateLimit,
  database,
  readSmallJson,
} from "@/lib/community";
import { subscriptionSchema } from "@/lib/validation";
export const POST = async (request: Request): Promise<Response> => {
  try {
    const identity = await authorizeSubmission(request);
    if (identity instanceof Response) return identity;
    let body: unknown;
    try {
      body = await readSmallJson(request);
    } catch {
      return Response.json(
        { error: "Please check your request." },
        { status: 400 },
      );
    }
    const parsed = subscriptionSchema.safeParse(body);
    if (!parsed.success)
      return Response.json(
        { error: "Choose whether you want to receive updates." },
        { status: 400 },
      );
    // Opt-outs must remain possible even when a user has reached the submission limit.
    if (parsed.data.subscribed && !(await consumeRateLimit(identity.userId)))
      return Response.json(
        { error: "Please try again in an hour." },
        { status: 429 },
      );
    const sql = database();
    await sql`INSERT INTO subscriptions (user_id,email,subscribed,consent_version,updated_at) VALUES (${identity.userId},${identity.email},${parsed.data.subscribed},'2026-10-05',now()) ON CONFLICT (user_id) DO UPDATE SET email=EXCLUDED.email,subscribed=EXCLUDED.subscribed,consent_version=EXCLUDED.consent_version,updated_at=now()`;
    return Response.json({ subscribed: parsed.data.subscribed });
  } catch {
    return Response.json(
      { error: "We couldn’t save that preference. Please try again shortly." },
      { status: 503 },
    );
  }
};
