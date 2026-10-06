import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const source = JSON.parse(
  await readFile(
    new URL("../content/plugins-source.json", import.meta.url),
    "utf8",
  ),
);
for (const plugin of source.plugins) {
  const metadata = JSON.parse(
    execFileSync("gh", ["api", `repos/RoamJS/${plugin.slug}`], {
      encoding: "utf8",
    }),
  );
  if (metadata.private)
    throw new Error(`Refusing to import private repository ${plugin.slug}`);
  const readme = JSON.parse(
    execFileSync("gh", ["api", `repos/RoamJS/${plugin.slug}/readme`], {
      encoding: "utf8",
    }),
  );
  plugin.readme = Buffer.from(readme.content, "base64").toString("utf8");
  plugin.readmeSha = readme.sha;
  plugin.readmeUrl = readme.html_url;
}
source.documentationFetched = new Date().toISOString();
await writeFile(
  new URL("../content/plugins-source.json", import.meta.url),
  JSON.stringify(source, null, 2) + "\n",
);
const plugins = source.plugins.map((plugin) =>
  Object.fromEntries(
    Object.entries(plugin).filter(
      ([key]) => !["readme", "readmeUrl", "readmeSha"].includes(key),
    ),
  ),
);
await writeFile(
  new URL("../content/plugins-index.json", import.meta.url),
  JSON.stringify({ snapshotDate: source.snapshotDate, plugins }, null, 2) +
    "\n",
);
console.log(
  `Refreshed ${plugins.length} public README snapshots. Download counts are unchanged.`,
);
