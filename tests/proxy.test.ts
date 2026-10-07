import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { CookieMethodsServer } from "@supabase/ssr";
const state = vi.hoisted(() => ({
  getClaims: vi.fn(),
  cookies: undefined as CookieMethodsServer | undefined,
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: { cookies: CookieMethodsServer },
  ) => {
    state.cookies = options.cookies;
    return { auth: { getClaims: state.getClaims } };
  },
}));
import proxy, { config } from "../proxy";
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test");
  state.getClaims.mockReset();
});
describe("session refresh", () => {
  it("forwards refreshed cookies to handlers and the browser without allowing caching", async () => {
    state.getClaims.mockImplementation(async () => {
      await state.cookies?.setAll?.(
        [
          {
            name: "sb-session",
            value: "refreshed",
            options: { path: "/", sameSite: "lax", secure: true },
          },
        ],
        {
          "Cache-Control": "private, no-store",
          Pragma: "no-cache",
          Expires: "0",
        },
      );
      return { data: {} };
    });
    const request = new NextRequest("https://roamjs.com/account");
    const response = await proxy(request);
    expect(request.cookies.get("sb-session")?.value).toBe("refreshed");
    expect(response.cookies.get("sb-session")?.value).toBe("refreshed");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Pragma")).toBe("no-cache");
    expect(response.headers.get("Expires")).toBe("0");
  });
  it("does not intercept existing extension OAuth or public catalog routes", () => {
    expect(config.matcher).toEqual([
      "/account",
      "/admin/:path*",
      "/api/admin/:path*",
      "/api/auth/:path*",
      "/api/suggestions",
      "/api/subscriptions",
    ]);
  });
});
