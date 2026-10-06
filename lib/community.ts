import "server-only";
import { requireVerifiedIdentity } from "./auth";
import { createClient } from "./supabase/server";
import { isSuggestionsConfigured, isNewsletterConfigured } from "./features";
import { isSameOrigin } from "./validation";

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
export const consumeRateLimit = async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("consume_community_rate_limit");
  if (error || typeof data !== "boolean")
    throw new Error("Rate limit unavailable");
  return data;
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
