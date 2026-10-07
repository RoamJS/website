import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: state.getUser }, rpc: state.rpc }),
}));
import { GET, PATCH } from "@/app/api/admin/suggestions/route";
import { replyLink } from "@/lib/suggestion-inbox";
const id = "63fbb2d2-3b95-4d1f-bd6c-9aa7c2177210";
const item = {
  id,
  email: "author@example.com",
  plugin_slug: null,
  title: "Useful suggestion",
  body: "This would make research easier.",
  created_at: "2026-10-06T00:00:00Z",
  status: "new",
  follow_up_note: "",
  followed_up_at: null,
  updated_at: "2026-10-06T00:00:00Z",
  version: 1,
};
const changes = {
  id,
  version: 1,
  status: "planned",
  note: "Will investigate",
  recordFollowUp: false,
};
const request = (body = changes, origin = "https://roamjs.com"): Request =>
  new Request("https://roamjs.com/api/admin/suggestions", {
    method: "PATCH",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test");
  state.getUser
    .mockReset()
    .mockResolvedValue({
      data: {
        user: {
          id: "owner",
          email: "owner@example.com",
          email_confirmed_at: "2026-10-06",
        },
      },
      error: null,
    });
  state.rpc
    .mockReset()
    .mockResolvedValue({ data: { items: [item] }, error: null });
});
describe("private suggestion inbox", () => {
  it.each([
    null,
    {
      email: "owner@example.com",
      user_metadata: { owner: true, email_verified: true },
    },
    {
      email: "owner@example.com",
      email_confirmed_at: "2026-10-06",
      is_anonymous: true,
    },
  ])(
    "rejects missing/unverified/anonymous identity before querying %j",
    async (user) => {
      state.getUser.mockResolvedValue({ data: { user }, error: null });
      expect(
        (await GET(new Request("https://roamjs.com/api/admin/suggestions")))
          .status,
      ).toBe(user ? 403 : 401);
      expect((await PATCH(request())).status).toBe(user ? 403 : 401);
      expect(state.rpc).not.toHaveBeenCalled();
    },
  );
  it("does not treat a verified ordinary account as an owner", async () => {
    state.rpc.mockResolvedValue({ data: null, error: { code: "RW403" } });
    for (const response of [
      await GET(new Request("https://roamjs.com/api/admin/suggestions")),
      await PATCH(request()),
    ]) {
      expect(response.status).toBe(403);
      expect(response.headers.get("Cache-Control")).toBe("private, no-store");
      expect(JSON.stringify(await response.json())).not.toContain(item.email);
    }
  });
  it("passes bounded filters and separates the pagination sentinel", async () => {
    state.rpc.mockResolvedValue({
      data: { items: Array(26).fill(item) },
      error: null,
    });
    const response = await GET(
      new Request(
        "https://roamjs.com/api/admin/suggestions?status=planned&search=notes&page=2",
      ),
    );
    const body = await response.json();
    expect(body.items).toHaveLength(25);
    expect(body.hasMore).toBe(true);
    expect(state.rpc).toHaveBeenCalledWith("list_suggestion_inbox", {
      p_status: "planned",
      p_search: "notes",
      p_page: 2,
    });
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
  it.each([
    "page=-1",
    "page=1.5",
    "status=deleted",
    `search=${"x".repeat(201)}`,
  ])("rejects invalid filters %s", async (query) => {
    expect(
      (
        await GET(
          new Request(`https://roamjs.com/api/admin/suggestions?${query}`),
        )
      ).status,
    ).toBe(400);
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("rejects cross-origin writes before auth", async () => {
    expect((await PATCH(request(changes, "https://evil.example"))).status).toBe(
      403,
    );
    expect(state.getUser).not.toHaveBeenCalled();
  });
  it("records explicit follow-up only through a persisted receipt", async () => {
    state.rpc.mockResolvedValue({
      data: {
        ...item,
        status: "planned",
        follow_up_note: changes.note,
        version: 2,
      },
      error: null,
    });
    const response = await PATCH(request());
    expect(response.status).toBe(200);
    expect(state.rpc).toHaveBeenCalledWith("update_suggestion_review", {
      p_id: id,
      p_version: 1,
      p_status: "planned",
      p_note: changes.note,
      p_record_follow_up: false,
    });
    state.rpc.mockResolvedValue({ data: null, error: null });
    expect((await PATCH(request())).status).toBe(503);
  });
  it.each([
    ["RW409", 409],
    ["RW404", 404],
    ["XX000", 503],
  ])(
    "maps errors without leaking database details %s",
    async (code, status) => {
      state.rpc.mockResolvedValue({
        data: null,
        error: { code, message: "private server detail" },
      });
      const response = await PATCH(request());
      expect(response.status).toBe(status);
      expect(JSON.stringify(await response.json())).not.toContain(
        "private server detail",
      );
    },
  );
  it("rejects oversized notes and spoofed owner fields", async () => {
    expect(
      (await PATCH(request({ ...changes, note: "👍".repeat(2001) }))).status,
    ).toBe(400);
    const spoof = { ...changes, owner: true };
    expect((await PATCH(request(spoof))).status).toBe(400);
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("encodes reply headers and never opens another protocol", () => {
    const href = replyLink({
      email: "author+test@example.com",
      title: "Hi\r\nBcc: other@example.com & stuff",
    });
    expect(href.startsWith("mailto:")).toBe(true);
    expect(href).not.toContain("%0A");
    expect(href).not.toContain("%0D");
    expect(href).toContain("%26");
  });
});
