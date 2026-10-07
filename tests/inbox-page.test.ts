import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  identity: vi.fn(),
  rpc: vi.fn(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requireVerifiedIdentity: state.identity }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ rpc: state.rpc }),
}));
vi.mock("next/navigation", () => ({
  redirect: state.redirect,
  notFound: state.notFound,
}));
vi.mock("@/components/suggestion-inbox", () => ({
  SuggestionInbox: () => createElement("div", null, "Private inbox controls"),
}));
import Inbox from "@/app/admin/suggestions/page";
beforeEach(() => {
  state.identity
    .mockReset()
    .mockResolvedValue({ userId: "owner", email: "owner@example.com" });
  state.rpc.mockReset().mockResolvedValue({ data: { items: [] }, error: null });
  state.redirect.mockReset().mockImplementation(() => {
    throw new Error("redirect");
  });
  state.notFound.mockReset().mockImplementation(() => {
    throw new Error("not-found");
  });
});
describe("server-rendered inbox access", () => {
  it.each([401, 403])(
    "redirects missing/unverified sessions before rendering or querying %s",
    async (status) => {
      state.identity.mockResolvedValue(
        Response.json({ error: "Sign in" }, { status }),
      );
      await expect(Inbox()).rejects.toThrow("redirect");
      expect(state.redirect).toHaveBeenCalledWith("/account?next=inbox");
      expect(state.rpc).not.toHaveBeenCalled();
    },
  );
  it.each(["RW403", "42501"])(
    "blocks verified nonowners before rendering %s",
    async (code) => {
      state.rpc.mockResolvedValue({ data: null, error: { code } });
      await expect(Inbox()).rejects.toThrow("not-found");
    },
  );
  it("renders controls only after database owner authorization", async () => {
    const html = renderToStaticMarkup(await Inbox());
    expect(html).toContain("Private inbox controls");
    expect(state.rpc).toHaveBeenCalledWith("list_suggestion_inbox", {
      p_status: null,
      p_search: "",
      p_page: 0,
    });
  });
  it("does not render the page on auth or database outages", async () => {
    state.identity.mockResolvedValue(
      Response.json({ error: "Unavailable" }, { status: 503 }),
    );
    await expect(Inbox()).rejects.toThrow("Unable to verify page access");
    expect(state.rpc).not.toHaveBeenCalled();
    state.identity.mockResolvedValue({
      userId: "owner",
      email: "owner@example.com",
    });
    state.rpc.mockResolvedValue({ data: null, error: { code: "XX000" } });
    await expect(Inbox()).rejects.toThrow("Unable to verify page access");
  });
});
