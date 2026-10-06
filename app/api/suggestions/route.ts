import {
  authorizeSubmission,
  consumeRateLimit,
  database,
  readSmallJson,
} from "@/lib/community";
import { suggestionSchema } from "@/lib/validation";
import { getPlugin } from "@/lib/catalog";
export const POST = async (request: Request): Promise<Response> => {
  try {
    const identity = await authorizeSubmission(request);
    if (identity instanceof Response) return identity;
    let body: unknown;
    try {
      body = await readSmallJson(request);
    } catch {
      return Response.json(
        { error: "Please check your submission and try again." },
        { status: 400 },
      );
    }
    const parsed = suggestionSchema.safeParse(body);
    if (!parsed.success)
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    const input = parsed.data;
    if (input.pluginSlug !== null && !getPlugin(input.pluginSlug))
      return Response.json(
        { error: "This plugin could not be found." },
        { status: 400 },
      );
    if (!(await consumeRateLimit(identity.userId)))
      return Response.json(
        {
          error:
            "You have sent several requests recently. Please try again in an hour.",
        },
        { status: 429 },
      );
    const sql = database();
    const rows =
      await sql`INSERT INTO suggestions (request_id, user_id, email, plugin_slug, title, body) VALUES (${input.requestId},${identity.userId},${identity.email},${input.pluginSlug},${input.title},${input.body}) ON CONFLICT (user_id, request_id) DO UPDATE SET request_id=EXCLUDED.request_id RETURNING id`;
    return Response.json({ id: rows[0].id }, { status: 201 });
  } catch {
    return Response.json(
      { error: "We couldn’t save your idea. Please try again shortly." },
      { status: 503 },
    );
  }
};
