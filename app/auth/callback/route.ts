import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  INBOX_RETURN_COOKIE,
  INBOX_RETURN_COOKIE_PATH,
} from "@/lib/auth-return";
import { isAuthConfigured } from "@/lib/features";
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const code = request.nextUrl.searchParams.get("code");
  let success = false;
  if (code && isAuthConfigured()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      success = !error;
    } catch {
      /* Show a recoverable error without exposing auth details. */
    }
  }
  const returnToInbox = request.cookies.get(INBOX_RETURN_COOKIE)?.value === "1";
  const destination = success
    ? returnToInbox
      ? "/admin/suggestions"
      : "/account"
    : returnToInbox
      ? "/account?error=expired&next=inbox"
      : "/account?error=expired";
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set(INBOX_RETURN_COOKIE, "", {
    path: INBOX_RETURN_COOKIE_PATH,
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
};
