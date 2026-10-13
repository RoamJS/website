import { newsletterAction } from "@/lib/newsletter-actions";
export const POST = (request: Request): Promise<Response> =>
  newsletterAction({ request, action: "unsubscribe" });
