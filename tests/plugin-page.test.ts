import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/features", () => ({ isSuggestionsConfigured: () => true }));
vi.mock("next/navigation", () => ({
  notFound: (): never => {
    throw new Error("not-found");
  },
}));

import PluginPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/plugins/[slug]/page";

const renderPlugin = async (slug: string): Promise<string> =>
  renderToStaticMarkup(await PluginPage({ params: Promise.resolve({ slug }) }));

describe("plugin availability and instructions", () => {
  it("renders Depot installation instructions and the standard suggestion tab", async () => {
    const html = await renderPlugin("find-in-page");
    expect(html).toContain("Find it in Roam Depot");
    expect(html).toContain("Settings → Roam Depot");
    expect(html).not.toContain("Coming soon");
    expect(html).not.toContain("isn’t available");
    expect(html).not.toContain("Once the extension is available");
    expect(html).toContain("About this plugin");
    expect(html).toContain("Suggest a change");
    expect(html).toContain("View on GitHub");
    for (const unavailable of [
      "View source",
      "From the plugin’s public README",
      "Depot downloads",
      "<video",
      "<iframe",
    ]) {
      expect(html).not.toContain(unavailable);
    }
  });

  it("explains folded text, occurrence navigation, editing shortcuts and search boundaries", async () => {
    const html = await renderPlugin("find-in-page");
    for (const detail of [
      "folded blocks",
      "same block",
      "Cmd+F",
      "Ctrl+F",
      "Shift+Enter",
      "Cmd/Ctrl+Enter",
      "Escape",
      "Find In Page: Focus Current Match",
      "literal and case-insensitive",
      "whole graph",
      "right sidebar",
      "fuzzy matching",
      "250 matching blocks",
    ]) {
      expect(html).toContain(detail);
    }
  });

  it("preserves Depot instructions and public provenance for an existing plugin", async () => {
    const html = await renderPlugin("smartblocks");
    expect(html).toContain("Find it in Roam Depot");
    expect(html).toContain("View on GitHub");
    expect(html).toContain("From the plugin’s public README");
    expect(html).toContain("Suggest a change");
    expect(html).not.toContain("Coming soon");
  });

  it("generates the announced route and metadata and rejects unknown plugins", async () => {
    expect(generateStaticParams()).toContainEqual({ slug: "find-in-page" });
    expect(
      await generateMetadata({
        params: Promise.resolve({ slug: "find-in-page" }),
      }),
    ).toMatchObject({
      title: "Find In Page",
      description: expect.stringContaining("folded blocks"),
    });
    await expect(renderPlugin("not-a-plugin")).rejects.toThrow("not-found");
  });
});
