import { authorizeSubmission, readSmallJson } from "@/lib/community";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
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
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("submit_suggestion", {
      p_request_id: input.requestId,
      p_plugin_slug: input.pluginSlug,
      p_title: input.title,
      p_body: input.body,
    });
    if (error) {
      if (error.code === "RW429")
        return Response.json(
          {
            error:
              "You have sent several requests recently. Please try again in an hour.",
          },
          { status: 429 },
        );
      if (error.code === "RW409")
        return Response.json(
          {
            error:
              "This request was already used for a different idea. Please reload and try again.",
          },
          { status: 409 },
        );
      if (error.code === "RW403")
        return Response.json(
          { error: "Verify your email before continuing." },
          { status: 403 },
        );
      throw new Error("Suggestion persistence unavailable");
    }
    const saved = z
      .object({ id: z.string().uuid(), duplicate: z.boolean() })
      .safeParse(data);
    if (!saved.success) throw new Error("Missing saved record");
    return Response.json(
      { id: saved.data.id },
      { status: saved.data.duplicate ? 200 : 201 },
    );
  } catch {
    return Response.json(
      { error: "We couldn’t save your idea. Please try again shortly." },
      { status: 503 },
    );
  }
};
