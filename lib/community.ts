import "server-only";
import { requireVerifiedIdentity } from "./auth";
import { isSuggestionsConfigured } from "./features";
import { isSameOrigin } from "./validation";

export const authorizeSubmission = async (
  request: Request,
): Promise<{ userId: string; email: string } | Response> => {
  if (!isSameOrigin(request))
    return Response.json(
      { error: "This request could not be verified. Please reload the page." },
      { status: 403 },
    );
  const identity = await requireVerifiedIdentity();
  if (identity instanceof Response) return identity;
  if (!isSuggestionsConfigured())
    return Response.json(
      { error: "Suggestions are not open yet." },
      { status: 503 },
    );
  return identity;
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
