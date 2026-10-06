import source from "@/content/plugins-index.json";
export const categories = [
  "All plugins",
  "Writing & thinking",
  "Productivity",
  "Navigation",
  "Integrations",
  "Appearance",
  "Developer tools",
] as const;
export type Category = (typeof categories)[number];
const descriptions: Record<string, [Category, string]> = {
  smartblocks: [
    "Productivity",
    "Create dynamic blocks, templates, and automations to work faster in Roam.",
  ],
  "query-builder": [
    "Writing & thinking",
    "Build complex queries with a simple, visual interface.",
  ],
  workbench: ["Productivity", "A toolkit for everyday Roam workflows."],
  autotag: [
    "Writing & thinking",
    "Turn page mentions into links automatically, and keep your thoughts connected.",
  ],
  "todo-trigger": [
    "Productivity",
    "Make checking a task off do more: add timestamps, update tags, or file completed work.",
  ],
  google: ["Integrations", "Bring Google Calendar and Drive into Roam."],
  dropbox: [
    "Integrations",
    "Keep attachments in Dropbox and bring their shareable links into your graph.",
  ],
  presentation: [
    "Writing & thinking",
    "Turn your notes into clean, beautiful presentations.",
  ],
  otter: [
    "Integrations",
    "Bring Otter.ai recordings into Roam as timestamped transcripts.",
  ],
  mapbox: [
    "Integrations",
    "Put places on the page with interactive maps, markers, and links to your notes.",
  ],
  slack: [
    "Integrations",
    "Send a Roam block and its children to a Slack channel.",
  ],
  hypothesis: [
    "Integrations",
    "Bring your Hypothes.is highlights and annotations back to where you think.",
  ],
  giphy: [
    "Integrations",
    "Find just the right GIF and add a little personality to your notes.",
  ],
  breadcrumbs: ["Navigation", "Find your way back to recent pages and blocks."],
  "oura-ring": [
    "Integrations",
    "Bring daily sleep, activity, and readiness summaries into your Daily Notes.",
  ],
  stats: [
    "Productivity",
    "Get a clearer picture of your graph with page, block, and reference statistics.",
  ],
  tldraw: [
    "Writing & thinking",
    "Step outside the outline. Connect pages and blocks on a visual whiteboard.",
  ],
  "sticky-notes": [
    "Writing & thinking",
    "A little space for thoughts in progress. Keep scratch notes above your graph.",
  ],
  "custom-dark-mode": [
    "Appearance",
    "Make Roam comfortable after dark with adjustable colors and thoughtful presets.",
  ],
  "quick-switcher": [
    "Navigation",
    "Move between pages and blocks with a focused, keyboard-friendly switcher.",
  ],
  "attribute-select": [
    "Productivity",
    "Turn attributes into dropdowns and sliders for more consistent, structured notes.",
  ],
  "block-attribution": [
    "Productivity",
    "See who created or last edited a block, right where you are working.",
  ],
  "media-gallery": [
    "Navigation",
    "One place to find the images, videos, audio, and files scattered across your graph.",
  ],
  "pinned-blocks": [
    "Productivity",
    "Keep important blocks at the top, even as the rest of your outline changes.",
  ],
  "recent-changes": [
    "Navigation",
    "Pick up where you left off with a view of recently changed pages and blocks.",
  ],
  "ranked-search": [
    "Navigation",
    "Explore your graph with ranked search results.",
  ],
  developer: [
    "Developer tools",
    "Build and run your own extensions from inside Roam.",
  ],
  "static-site": [
    "Developer tools",
    "Publish pages from your Roam graph as a website.",
  ],
};
export const plugins = source.plugins.map((p) => ({
  ...p,
  category: descriptions[p.slug]?.[0] ?? "Productivity",
  description: descriptions[p.slug]?.[1] ?? p.name,
}));
export type Plugin = (typeof plugins)[number];
export const catalogDate = source.snapshotDate;
export const getPlugin = (slug: string): Plugin | undefined =>
  plugins.find((p) => p.slug === slug);
export const filterPlugins = ({
  query,
  category,
  sort,
}: {
  query: string;
  category: string;
  sort: string;
}): Plugin[] => {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return plugins
    .filter(
      (p) =>
        (category === "All plugins" || p.category === category) &&
        terms.every((term) =>
          `${p.name} ${p.description} ${p.category}`
            .toLowerCase()
            .includes(term),
        ),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : (b.downloads ?? -1) - (a.downloads ?? -1),
    );
};
