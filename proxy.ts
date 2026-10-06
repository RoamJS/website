import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAuthConfigured } from "@/lib/features";
const proxy = async (request: NextRequest): Promise<NextResponse> => {
  let response = NextResponse.next({ request });
  if (!isAuthConfigured()) return response;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values, headers) => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );
  await supabase.auth.getClaims();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
};
export default proxy;
// Public catalog pages remain cacheable; existing extension OAuth routes are untouched.
export const config = {
  matcher: [
    "/account",
    "/api/auth/:path*",
    "/api/suggestions",
    "/api/subscriptions",
  ],
};
