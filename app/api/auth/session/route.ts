import { requireVerifiedIdentity } from "@/lib/auth";
export const dynamic = "force-dynamic";
export const GET = async (): Promise<Response> => {
  const identity = await requireVerifiedIdentity();
  const response =
    identity instanceof Response ? identity : Response.json({ verified: true });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
};
