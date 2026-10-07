import { z } from "zod";
import { requireVerifiedIdentity } from "@/lib/auth";
import { readSmallJson } from "@/lib/community";
import { createClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/validation";
import {
  inboxSchema,
  reviewReceiptSchema,
  reviewStatuses,
  reviewUpdateSchema,
} from "@/lib/suggestion-inbox";
const reply = (body: unknown, status = 200): Response =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
const identityFailure = async (): Promise<Response | null> => {
  const identity = await requireVerifiedIdentity();
  return identity instanceof Response
    ? reply(await identity.json(), identity.status)
    : null;
};
const databaseFailure = (code?: string): Response => {
  if (code === "RW403" || code === "42501")
    return reply(
      { error: "This inbox is only available to the site owner." },
      403,
    );
  if (code === "RW409")
    return reply(
      {
        error:
          "This suggestion changed in another session. Reload the inbox before saving again; your draft is still here.",
      },
      409,
    );
  if (code === "RW404")
    return reply({ error: "This suggestion is no longer available." }, 404);
  if (code === "RW400")
    return reply({ error: "Please check your changes." }, 400);
  return reply(
    { error: "The inbox is temporarily unavailable. Please try again." },
    503,
  );
};
export const GET = async (request: Request): Promise<Response> => {
  try {
    const denied = await identityFailure();
    if (denied) return denied;
    const query = new URL(request.url).searchParams;
    const parsed = z
      .object({
        status: z.enum(reviewStatuses).nullable(),
        search: z.string().max(200),
        page: z.coerce.number().int().min(0).max(100000),
      })
      .safeParse({
        status: query.get("status"),
        search: query.get("search") ?? "",
        page: query.get("page") ?? 0,
      });
    if (!parsed.success) return reply({ error: "Invalid inbox filter." }, 400);
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("list_suggestion_inbox", {
      p_status: parsed.data.status,
      p_search: parsed.data.search,
      p_page: parsed.data.page,
    });
    if (error) return databaseFailure(error.code);
    const list = inboxSchema.safeParse(data);
    if (!list.success) return databaseFailure();
    return reply({
      items: list.data.items.slice(0, 25),
      hasMore: list.data.items.length > 25,
    });
  } catch {
    return databaseFailure();
  }
};
export const PATCH = async (request: Request): Promise<Response> => {
  if (!isSameOrigin(request))
    return reply({ error: "Please reload the page and try again." }, 403);
  try {
    const denied = await identityFailure();
    if (denied) return denied;
    let body: unknown;
    try {
      body = await readSmallJson(request);
    } catch {
      return reply({ error: "Please check your changes." }, 400);
    }
    const parsed = reviewUpdateSchema.safeParse(body);
    if (!parsed.success)
      return reply(
        {
          error:
            "Please check your changes. Notes can contain up to 2000 characters.",
        },
        400,
      );
    const supabase = await createClient();
    const { id, version, status, note, recordFollowUp } = parsed.data;
    const { data, error } = await supabase.rpc("update_suggestion_review", {
      p_id: id,
      p_version: version,
      p_status: status,
      p_note: note,
      p_record_follow_up: recordFollowUp,
    });
    if (error) return databaseFailure(error.code);
    const receipt = reviewReceiptSchema.safeParse(data);
    if (!receipt.success || receipt.data.id !== id) return databaseFailure();
    return reply(receipt.data);
  } catch {
    return databaseFailure();
  }
};
