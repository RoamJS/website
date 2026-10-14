import { processSuggestionNotifications } from "@/lib/suggestion-notifications";

export const GET = async (request: Request): Promise<Response> => {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response("Unauthorized", { status: 401 });
  try {
    const processed = await processSuggestionNotifications({ limit: 25 });
    return Response.json(
      { processed },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Notification retry unavailable" },
      { status: 503 },
    );
  }
};
