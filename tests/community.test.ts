import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ currentUser: vi.fn(), sql: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ currentUser: state.currentUser }));
vi.mock("@neondatabase/serverless", () => ({ neon: () => state.sql }));
import { POST as suggest } from "@/app/api/suggestions/route";
import { POST as subscribe } from "@/app/api/subscriptions/route";
const valid = {
  requestId: "df864027-d036-4e2f-a963-2c135ff66adb",
  pluginSlug: "smartblocks",
  title: "A useful idea",
  body: "Help me find my notes across projects.",
};
const request = (data: unknown): Request =>
  new Request("https://roamjs.com/api/suggestions", {
    method: "POST",
    headers: {
      origin: "https://roamjs.com",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "test");
  vi.stubEnv("CLERK_SECRET_KEY", "test");
  vi.stubEnv("DATABASE_URL", "test");
  state.sql.mockReset().mockResolvedValue([{ id: 1, attempts: 1 }]);
  state.currentUser.mockReset().mockResolvedValue({
    id: "user_1",
    primaryEmailAddressId: "email_1",
    emailAddresses: [
      {
        id: "email_1",
        emailAddress: "verified@example.com",
        verification: { status: "verified" },
      },
    ],
  });
});
describe("community API", () => {
  it("fails closed when services are not configured", async () => {
    vi.stubEnv("DATABASE_URL", "");
    expect((await suggest(request(valid))).status).toBe(503);
    expect(state.sql).not.toHaveBeenCalled();
  });
  it("requires a session", async () => {
    state.currentUser.mockResolvedValue(null);
    expect((await suggest(request(valid))).status).toBe(401);
    expect(state.sql).not.toHaveBeenCalled();
  });
  it("requires a verified primary email", async () => {
    state.currentUser.mockResolvedValue({
      id: "user_1",
      primaryEmailAddressId: null,
      emailAddresses: [],
    });
    expect((await suggest(request(valid))).status).toBe(403);
  });
  it("rejects unknown plugin IDs before writing", async () => {
    expect(
      (await suggest(request({ ...valid, pluginSlug: "unknown" }))).status,
    ).toBe(400);
    expect(state.sql).not.toHaveBeenCalled();
  });
  it("uses server identity and never subscribes an idea author", async () => {
    expect((await suggest(request(valid))).status).toBe(201);
    expect(state.sql.mock.calls[1].slice(1)).toContain("verified@example.com");
    expect(
      state.sql.mock.calls.map((c) => c[0].join("")).join(""),
    ).not.toContain("INSERT INTO subscriptions");
  });
  it("rate limits writes across requests", async () => {
    state.sql.mockResolvedValue([]);
    expect((await suggest(request(valid))).status).toBe(429);
    expect(state.sql).toHaveBeenCalledTimes(1);
  });
  it("returns an error when persistence fails", async () => {
    state.sql.mockRejectedValue(new Error("DB unavailable"));
    expect((await suggest(request(valid))).status).toBe(503);
  });
  it("allows an opt-out without consuming the submission limit", async () => {
    expect((await subscribe(request({ subscribed: false }))).status).toBe(200);
    expect(state.sql).toHaveBeenCalledTimes(1);
    expect(state.sql.mock.calls[0][0].join("")).toContain(
      "INSERT INTO subscriptions",
    );
  });
  it("rejects excessively large bodies", async () => {
    expect(
      (await suggest(request({ ...valid, body: "x".repeat(25000) }))).status,
    ).toBe(400);
    expect(state.sql).not.toHaveBeenCalled();
  });
});
