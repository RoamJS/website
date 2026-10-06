import documentation from "@/content/plugins-source.json";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Download,
  GitFork,
  Info,
} from "lucide-react";
import { getPlugin, plugins } from "@/lib/catalog";
import { isCommunityConfigured } from "@/lib/features";
import { prepareReadme, resolveReadmeUrl } from "@/lib/markdown";
import { PluginIcon } from "@/components/plugin-icon";
import { PluginTabs } from "@/components/plugin-tabs";
import { Button } from "@/components/ui/button";
export const generateStaticParams = (): { slug: string }[] =>
  plugins.map((p) => ({ slug: p.slug }));
export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> => {
  const p = getPlugin((await params).slug);
  return { title: p?.name ?? "Plugin not found", description: p?.description };
};
const PluginPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.JSX.Element> => {
  const plugin = getPlugin((await params).slug);
  const readme = documentation.plugins.find((p) => p.slug === plugin?.slug);
  if (!plugin || !readme) notFound();
  const p = { ...plugin, ...readme };
  const pending = p.readme.startsWith("# RoamJS Extension Base");
  return (
    <main id="main" className="mx-auto max-w-6xl px-5 pt-10 md:px-8">
      <Link
        href="/#plugins"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground"
      >
        <ArrowLeft className="size-3" /> All plugins
      </Link>
      <section className="mb-10 mt-9 border-b pb-10">
        <div className="flex items-center gap-4">
          <PluginIcon slug={p.slug} className="size-16 rounded-2xl" />
          <div>
            <p className="eyebrow mb-2">{p.category}</p>
            <h1 className="text-4xl font-medium tracking-tight">{p.name}</h1>
          </div>
        </div>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {p.description}
        </p>
        {p.slug === "static-site" && (
          <p className="mt-4 rounded-lg bg-secondary p-4 text-sm">
            <Info className="mr-2 inline size-4" />
            This repository is marked deprecated. Read the source notice before
            using it.
          </p>
        )}
      </section>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div id="plugin-content" className="min-w-0 scroll-mt-36">
          <PluginTabs
            slug={p.slug}
            name={p.name}
            enabled={isCommunityConfigured()}
          >
            {pending ? (
              <div className="rounded-xl border p-7">
                <h2 className="text-lg font-medium">
                  This guide is being prepared
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  The public repository still has starter documentation. Visit
                  the source for current development details.
                </p>
                <a
                  className="mt-4 inline-block text-sm text-primary underline"
                  href={p.repository}
                >
                  View the repository ↗
                </a>
              </div>
            ) : (
              <>
                <p className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
                  <BookOpen className="size-3.5" />
                  From the plugin’s public README ·{" "}
                  <a href={p.readmeUrl} className="underline">
                    View source
                  </a>
                </p>
                <article className="prose">
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    skipHtml
                    components={{
                      a: ({ href, children }) => (
                        <a
                          href={resolveReadmeUrl({
                            url: href ?? "",
                            readmeUrl: p.readmeUrl,
                          })}
                        >
                          {children}
                        </a>
                      ),
                      img: ({ src, alt }) =>
                        typeof src === "string" ? (
                          <Image
                            src={resolveReadmeUrl({
                              url: src,
                              readmeUrl: p.readmeUrl,
                              image: true,
                            })}
                            alt={alt || "Screenshot from the plugin guide"}
                            width={1200}
                            height={720}
                            unoptimized
                            className="h-auto w-full"
                          />
                        ) : null,
                    }}
                  >
                    {prepareReadme(p.readme)}
                  </Markdown>
                </article>
              </>
            )}
          </PluginTabs>
        </div>
        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-xl border bg-card p-6">
            <p className="eyebrow mb-4">MAKE IT PART OF YOUR GRAPH</p>
            <h2 className="text-lg font-medium">
              {p.depotId ? "Find it in Roam Depot" : "Explore the repository"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {p.depotId
                ? `In Roam, open Settings → Roam Depot and search for “${p.name}”. Review the guide, then install.`
                : "Check the repository for availability, installation details, and development status."}
            </p>
            <Button asChild className="mt-5 w-full" variant="outline">
              <a href={p.repository}>
                View on GitHub
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
            <Link
              href="/getting-started"
              className="mt-4 block text-center text-xs text-muted-foreground underline"
            >
              New to plugins? Start here
            </Link>
          </div>
          {p.downloads !== null && (
            <div className="px-1">
              <p className="flex items-center gap-2 text-sm">
                <Download className="size-4 text-muted-foreground" />
                {p.downloads.toLocaleString("en-US")} Depot downloads
              </p>
            </div>
          )}
          <div className="flex items-center gap-2 border-t pt-5 text-xs text-muted-foreground">
            <GitFork className="size-4" />
            Open source · by RoamJS
          </div>
        </aside>
      </div>
    </main>
  );
};
export default PluginPage;
