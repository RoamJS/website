import { clerkMiddleware } from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
} from "next/server";
const clerk = clerkMiddleware();
const proxy = (
  request: NextRequest,
  event: NextFetchEvent,
): ReturnType<typeof clerk> => {
  if (
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    !process.env.CLERK_SECRET_KEY
  )
    return NextResponse.next();
  return clerk(request, event);
};
export default proxy;
export const config = {
  matcher: [
    "/",
    "/plugins/:path*",
    "/getting-started",
    "/ideas",
    "/updates",
    "/privacy",
    "/api/suggestions",
    "/api/subscriptions",
  ],
};
