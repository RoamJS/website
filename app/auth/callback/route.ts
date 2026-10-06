import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  const response = NextResponse.redirect(
    new URL(success ? "/account" : "/account?error=expired", request.url),
  );
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
};
