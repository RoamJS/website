import "server-only";
import { requireVerifiedIdentity } from "./auth";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { isSuggestionsConfigured, isNewsletterConfigured } from "./features";
import { isSameOrigin } from "./validation";
export const database = (): NeonQueryFunction<false, false> =>
  neon(process.env.DATABASE_URL!);
export const authorizeSubmission = async ({
  request,
  kind,
}: {
  request: Request;
  kind: "suggestion" | "newsletter";
}): Promise<{ userId: string; email: string } | Response> => {
  if (!isSameOrigin(request))
    return Response.json(
      { error: "This request could not be verified. Please reload the page." },
      { status: 403 },
    );
  const identity = await requireVerifiedIdentity();
  if (identity instanceof Response) return identity;
  const enabled =
    kind === "suggestion"
      ? isSuggestionsConfigured()
      : isNewsletterConfigured();
  if (!enabled)
    return Response.json(
      {
        error:
          kind === "suggestion"
            ? "Suggestions are not open yet."
            : "Newsletter signup is not open yet.",
      },
      { status: 503 },
    );
  return identity;
};
export const consumeRateLimit = async (userId: string): Promise<boolean> => {
  const sql = database();
  const rows =
    await sql`INSERT INTO community_rate_limits (user_id, window_start, attempts) VALUES (${userId}, date_trunc('hour', now()), 1) ON CONFLICT (user_id) DO UPDATE SET window_start = EXCLUDED.window_start, attempts = CASE WHEN community_rate_limits.window_start < EXCLUDED.window_start THEN 1 ELSE community_rate_limits.attempts + 1 END WHERE community_rate_limits.window_start < EXCLUDED.window_start OR community_rate_limits.attempts < 10 RETURNING attempts`;
  return rows.length > 0;
};
export const readSmallJson = async (request: Request): Promise<unknown> => {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new Error("Expected JSON");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Empty body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 24000) {
      await reader.cancel();
      throw new Error("Request too large");
    }
    chunks.push(value);
  }
  const data = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(data));
};
