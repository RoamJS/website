import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  getUser: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: state }),
}));
import { GET as session } from "@/app/api/auth/session/route";
import { GET as callback } from "@/app/auth/callback/route";
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test");
  state.getUser.mockReset();
  state.exchangeCodeForSession.mockReset();
});
describe("verified session boundary", () => {
  it("verifies identity with the auth server and never returns email or tokens", async () => {
    state.getUser.mockResolvedValue({
      data: {
        user: {
          id: "u1",
          email: "person@example.com",
          email_confirmed_at: "2026-10-06",
        },
      },
      error: null,
    });
    const response = await session();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ verified: true });
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
  it.each([
    [null, 401],
    [{ email: "a@example.com", user_metadata: { email_verified: true } }, 403],
    [
      {
        email: "a@example.com",
        confirmed_at: "2026-10-06",
        phone_confirmed_at: "2026-10-06",
      },
      403,
    ],
    [
      {
        email: "a@example.com",
        email_confirmed_at: "2026-10-06",
        is_anonymous: true,
      },
      403,
    ],
  ])("rejects missing or unverified identity %j", async (user, status) => {
    state.getUser.mockResolvedValue({ data: { user }, error: null });
    const response = await session();
    expect(response.status).toBe(status);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
  it("fails closed on authentication outages", async () => {
    state.getUser.mockRejectedValue(new Error("unavailable"));
    expect((await session()).status).toBe(503);
  });
  it("does not call the service when unconfigured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect((await session()).status).toBe(503);
    expect(state.getUser).not.toHaveBeenCalled();
  });
});
describe("email link callback", () => {
  it("exchanges the code and redirects only to the same-origin account page", async () => {
    state.exchangeCodeForSession.mockResolvedValue({ error: null });
    const response = await callback(
      new NextRequest(
        "https://preview.example/auth/callback?code=one-time-code&next=https://evil.example",
      ),
    );
    expect(state.exchangeCodeForSession).toHaveBeenCalledWith("one-time-code");
    expect(response.headers.get("location")).toBe(
      "https://preview.example/account",
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  });
  it.each([
    [true, "/admin/suggestions"],
    [false, "/account?error=expired&next=inbox"],
  ])(
    "preserves and clears the fixed inbox return hint (success %s)",
    async (success, destination) => {
      state.exchangeCodeForSession.mockResolvedValue({
        error: success ? null : new Error("expired"),
      });
      const response = await callback(
        new NextRequest("https://preview.example/auth/callback?code=test", {
          headers: { cookie: "roamjs-inbox-return=1" },
        }),
      );
      expect(response.headers.get("location")).toBe(
        `https://preview.example${destination}`,
      );
      expect(response.cookies.get("roamjs-inbox-return")?.value).toBe("");
      expect(response.headers.get("set-cookie")).toContain(
        "Path=/auth/callback",
      );
      expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    },
  );
  it("ignores arbitrary cookie destinations", async () => {
    state.exchangeCodeForSession.mockResolvedValue({ error: null });
    const response = await callback(
      new NextRequest("https://preview.example/auth/callback?code=test", {
        headers: { cookie: "roamjs-inbox-return=https://evil.example" },
      }),
    );
    expect(response.headers.get("location")).toBe(
      "https://preview.example/account",
    );
  });
  it.each(["", "?code=expired"])(
    "recovers from missing or invalid codes %s",
    async (query) => {
      state.exchangeCodeForSession.mockResolvedValue({
        error: new Error("expired"),
      });
      const response = await callback(
        new NextRequest(`https://preview.example/auth/callback${query}`),
      );
      expect(response.headers.get("location")).toBe(
        "https://preview.example/account?error=expired",
      );
    },
  );
});
