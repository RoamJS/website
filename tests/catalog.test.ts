import { describe, expect, it } from "vitest";
import { filterPlugins, getPlugin, plugins } from "@/lib/catalog";
import docs from "@/content/plugins-source.json";
import { resolveReadmeUrl, prepareReadme } from "@/lib/markdown";
describe("plugin discovery", () => {
  it("combines search terms and categories without changing the source order", () => {
    const before = plugins.map((p) => p.slug);
    expect(
      filterPlugins({
        query: " GOOGLE calendar ",
        category: "Integrations",
        sort: "name",
      }).map((p) => p.slug),
    ).toEqual(["google"]);
    expect(
      filterPlugins({
        query: "google",
        category: "Navigation",
        sort: "popular",
      }),
    ).toEqual([]);
    expect(plugins.map((p) => p.slug)).toEqual(before);
  });
  it("keeps unknown download counts behind measured plugins", () => {
    const result = filterPlugins({
      query: "",
      category: "All plugins",
      sort: "popular",
    });
    expect(result[0].slug).toBe("smartblocks");
    expect(result[result.length - 1].downloads).toBeNull();
  });
  it("orders newest additions first and leaves undated plugins last", () => {
    const result = filterPlugins({
      query: "",
      category: "All plugins",
      sort: "newest",
    });
    expect(result.slice(0, 3).map((p) => p.slug)).toEqual([
      "quick-switcher",
      "custom-dark-mode",
      "tldraw",
    ]);
    expect(result.slice(-3).map((p) => p.slug)).toEqual([
      "developer",
      "pinned-blocks",
      "static-site",
    ]);
    const dated = result.filter((p) => p.created);
    expect(
      dated.every(
        (p, i) =>
          i === 0 ||
          Date.parse(dated[i - 1].created!) >= Date.parse(p.created!),
      ),
    ).toBe(true);
    expect(
      filterPlugins({ query: "", category: "Navigation", sort: "newest" }).map(
        (p) => p.slug,
      ),
    ).toEqual(["quick-switcher", "breadcrumbs"]);
  });
  it("excludes private repositories from the public library", () => {
    for (const slug of [
      "attribute-select",
      "media-gallery",
      "recent-changes",
      "ranked-search",
    ])
      expect(getPlugin(slug)).toBeUndefined();
  });
  it("has unique routes and source documentation for every catalog item", () => {
    expect(new Set(plugins.map((p) => p.slug)).size).toBe(plugins.length);
    for (const p of plugins) {
      expect(docs.plugins.find((d) => d.slug === p.slug)?.readmeSha).toMatch(
        /^[a-f0-9]{40}$/,
      );
      expect(p.repository).toMatch(/^https:\/\/github.com\/RoamJS\//);
    }
    expect(getPlugin("missing")).toBeUndefined();
  });
});
describe("README rendering", () => {
  const readmeUrl = "https://github.com/RoamJS/workbench/blob/main/README.md";
  it("resolves relative guides and image links at the source", () => {
    expect(resolveReadmeUrl({ url: "docs/alert.md", readmeUrl })).toBe(
      "https://github.com/RoamJS/workbench/blob/main/docs/alert.md",
    );
    expect(
      resolveReadmeUrl({ url: "./demo.png", readmeUrl, image: true }),
    ).toBe("https://raw.githubusercontent.com/RoamJS/workbench/main/demo.png");
  });
  it("rejects executable or protocol-relative links", () => {
    expect(resolveReadmeUrl({ url: "javascript:alert(1)", readmeUrl })).toBe(
      "",
    );
    expect(resolveReadmeUrl({ url: "//evil.example", readmeUrl })).toBe("");
  });
  it("removes the duplicate brand and heading", () => {
    expect(
      prepareReadme(
        '<a href="https://roamjs.com/"><img src="logo"/></a>\n# Plugin\n\n## Usage\nHello',
      ),
    ).not.toContain("# Plugin");
  });
});
