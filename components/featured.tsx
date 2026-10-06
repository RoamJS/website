import Link from "next/link";
import type { ReactNode } from "react";
import { FeaturedCarousel } from "./featured-carousel";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  CircleCheck,
  Search,
  TextCursorInput,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const WorkflowPreview = (): React.JSX.Element => (
  <div
    aria-hidden="true"
    className="relative hidden h-[264px] w-full self-center sm:block"
  >
    <div className="absolute inset-y-2 left-0 right-0 rounded-lg border bg-background/60 p-5 text-xs xl:right-32">
      <span className="absolute left-2 top-2 font-mono text-[10px] text-muted-foreground/50">
        ⤒
      </span>
      <div className="mt-2 border-l border-border/70 pl-5">
        <p className="font-medium">• &nbsp; Meeting notes</p>
        <p className="mt-3 pl-3 text-muted-foreground">
          • &nbsp; Date: <span className="text-primary">[[Today]]</span>
        </p>
        <p className="mt-3 pl-3 text-muted-foreground">• &nbsp; Attendees:</p>
        <div className="ml-6 mt-3 h-28 border-l border-border/60" />
      </div>
    </div>
    <div className="absolute bottom-0 right-0 w-[225px] rounded-lg border bg-popover p-1.5 text-[11px] shadow-lg xl:right-32">
      {[
        { Icon: TextCursorInput, text: "@template:Meeting Notes" },
        { Icon: TextCursorInput, text: "@template:Project Update" },
        { Icon: TextCursorInput, text: "@template:1:1" },
        { Icon: CalendarDays, text: "@date:Today" },
        { Icon: Search, text: "@query:Recent notes" },
        { Icon: CircleCheck, text: "@shortcut:TODO" },
      ].map(({ Icon, text }, index) => (
        <div
          key={text}
          className={`flex items-center gap-2 rounded px-2 py-1.5 ${index === 0 ? "bg-accent text-primary" : "text-muted-foreground"}`}
        >
          <Icon className="size-3.5 shrink-0" />
          {text}
        </div>
      ))}
    </div>
    <div className="absolute right-0 top-24 hidden w-28 rotate-[-8deg] xl:block">
      <p className="handwritten text-xl leading-[1.05]">
        Turn ideas
        <br />
        into templates.
      </p>
      <svg
        className="ml-1 mt-3 h-16 w-20 text-brand-orange"
        viewBox="0 0 80 64"
        fill="none"
      >
        <path
          d="M64 3C60 35 40 50 7 49M16 41L6 49L17 57"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </div>
);

const PluginScreenshot = ({ slug }: { slug: string }): React.JSX.Element => (
  <span
    aria-hidden="true"
    className="relative hidden h-28 w-36 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-white shadow-sm xl:block"
  >
    <Image
      src={`/previews/${slug}.png`}
      alt=""
      width={slug === "query-builder" ? 938 : 1080}
      height={slug === "query-builder" ? 480 : 720}
      sizes="540px"
      className={`absolute max-w-none ${slug === "query-builder" ? "-top-[140px] left-0 w-[470px]" : "-left-[106px] -top-[38px] w-[540px]"}`}
    />
    <span className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-white/90 to-transparent" />
  </span>
);

const DarkModePreview = (): React.JSX.Element => (
  <div
    aria-hidden="true"
    className="relative hidden h-[264px] w-full transform-gpu self-center sm:block"
  >
    <div className="absolute inset-y-2 left-0 right-3 overflow-hidden rounded-lg border border-slate-700 bg-[#0d1117] p-5 text-[#c9d1d9]">
      <div className="flex items-center gap-1.5 border-b border-slate-700/60 pb-3">
        <span className="size-1.5 rounded-full bg-slate-600" />
        <span className="size-1.5 rounded-full bg-slate-600" />
        <span className="ml-auto text-[10px] text-slate-500">Daily notes</span>
      </div>
      <p className="mt-5 text-lg font-semibold">A little room to think.</p>
      <div className="mt-4 border-l border-slate-700 pl-3 text-[11px] leading-6 text-slate-400">
        <p>• &nbsp; Make space for the next idea</p>
        <p>
          • &nbsp; Explore{" "}
          <span className="text-[#58a6ff]">[[Connections]]</span>
        </p>
        <p>• &nbsp; Pick up where you left off</p>
      </div>
    </div>
    <div className="absolute bottom-0 right-0 w-[205px] rounded-lg border border-slate-600 bg-[#161b22] p-3.5 text-[11px] text-[#c9d1d9] shadow-lg">
      <div className="flex items-center justify-between">
        <span className="font-medium">Custom Dark Mode</span>
        <span className="rounded bg-[#58a6ff]/15 px-2 py-0.5 text-[#58a6ff]">
          Dark
        </span>
      </div>
      <p className="mt-3 text-slate-400">GitHub Primer</p>
      <div className="mt-2 flex gap-2">
        {[
          "bg-[#0d1117]",
          "bg-[#161b22]",
          "bg-[#30363d]",
          "bg-[#c9d1d9]",
          "bg-[#58a6ff]",
        ].map((color) => (
          <span
            key={color}
            className={`size-5 rounded-full border border-white/20 ${color}`}
          />
        ))}
      </div>
    </div>
  </div>
);

const DiscoveryPreview = ({ slug }: { slug: string }): React.JSX.Element => (
  <span
    aria-hidden="true"
    className="relative hidden h-28 w-36 shrink-0 xl:block"
  >
    {slug === "quick-switcher" ? (
      <span className="absolute inset-0 overflow-hidden rounded-lg border bg-popover p-2 text-[10px] shadow-sm">
        <span className="mb-1.5 flex items-center gap-1.5 border-b pb-2 text-muted-foreground">
          <Search className="size-3" /> Find a saved page
        </span>
        {["Project notes", "Reading list", "Daily notes"].map(
          (title, index) => (
            <span
              key={title}
              className={`block rounded px-2 py-1.5 ${index === 0 ? "bg-accent text-primary" : "text-muted-foreground"}`}
            >
              {title}
            </span>
          ),
        )}
      </span>
    ) : (
      <>
        <span className="absolute inset-x-3 inset-y-1 rotate-[-6deg] rounded-md border border-brand-orange/30 bg-brand-orange/10" />
        <span className="absolute inset-x-1 inset-y-1 rotate-[3deg] overflow-hidden rounded-md border border-brand-orange/40 bg-card shadow-sm">
          <span className="block border-b border-brand-orange/20 bg-brand-orange/15 px-2.5 py-1.5 text-[10px] font-medium text-brand-orange">
            A thought for later
          </span>
          <span className="block px-2.5 py-2 text-[11px] leading-5 text-muted-foreground">
            Connect this idea
            <br />
            to <span className="text-primary">[[Tomorrow]]</span>
          </span>
        </span>
      </>
    )}
  </span>
);

type FeaturedPlugin = { slug: string; name: string; description: string };

const FeaturedSlide = ({
  lead,
  secondary,
  preview,
}: {
  lead: FeaturedPlugin;
  secondary: FeaturedPlugin[];
  preview: ReactNode;
}): React.JSX.Element => (
  <div className="grid h-full gap-4 lg:grid-cols-[2.12fr_1fr]">
    <article className="feature-panel grid items-center gap-5 rounded-lg border bg-card px-6 py-6 sm:grid-cols-[0.95fr_1.05fr] xl:grid-cols-[0.85fr_1.15fr] xl:gap-8 xl:px-7">
      <div className="flex flex-col items-start">
        <p className="eyebrow mb-3">Featured plugin</p>
        <h3 className="text-4xl font-semibold tracking-[-.045em] xl:text-[52px] xl:leading-none">
          {lead.name}
        </h3>
        <p className="mt-4 max-w-[340px] text-base leading-[1.4] text-muted-foreground xl:text-xl">
          {lead.description}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-5 xl:gap-8">
          <Button asChild className="h-11 px-5">
            <Link href={`/plugins/${lead.slug}`}>
              View plugin <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>
      {preview}
    </article>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
      {secondary.map(({ slug, name, description }) => (
        <Link
          key={slug}
          href={`/plugins/${slug}`}
          className="feature-panel group flex items-center justify-between gap-4 rounded-lg border bg-card px-6 py-4 transition-colors hover:border-primary/60"
        >
          <div>
            <h3 className="text-2xl font-semibold leading-tight tracking-tight">
              {name}
            </h3>
            <p className="mt-1 text-sm leading-[1.4] text-muted-foreground">
              {description}
            </p>
            <span className="mt-2 inline-flex items-center gap-3 text-sm font-medium text-primary">
              View plugin{" "}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
          {slug === "query-builder" || slug === "workbench" ? (
            <PluginScreenshot slug={slug} />
          ) : (
            <DiscoveryPreview slug={slug} />
          )}
        </Link>
      ))}
    </div>
  </div>
);

export const Featured = (): React.JSX.Element => (
  <section
    aria-labelledby="featured-heading"
    aria-roledescription="carousel"
    className="pb-2"
  >
    <h2 id="featured-heading" className="sr-only">
      Featured plugins
    </h2>
    <FeaturedCarousel
      slides={[
        {
          label: "Newer plugins",
          content: (
            <FeaturedSlide
              lead={{
                slug: "custom-dark-mode",
                name: "Custom Dark Mode",
                description:
                  "Make Roam comfortable after dark with adjustable colors and thoughtful presets.",
              }}
              secondary={[
                {
                  slug: "quick-switcher",
                  name: "Quick Switcher",
                  description:
                    "Your saved pages and blocks, one quick search away.",
                },
                {
                  slug: "sticky-notes",
                  name: "Sticky Notes",
                  description:
                    "A little space for thoughts in progress. Keep scratch notes above your graph.",
                },
              ]}
              preview={<DarkModePreview />}
            />
          ),
        },
        {
          label: "Popular plugins",
          content: (
            <FeaturedSlide
              lead={{
                slug: "smartblocks",
                name: "SmartBlocks",
                description:
                  "Create dynamic blocks, templates, and automations to work faster in Roam.",
              }}
              secondary={[
                {
                  slug: "query-builder",
                  name: "Query Builder",
                  description:
                    "Build complex queries with a simple, visual interface.",
                },
                {
                  slug: "workbench",
                  name: "Workbench",
                  description: "A toolkit for everyday Roam workflows.",
                },
              ]}
              preview={<WorkflowPreview />}
            />
          ),
        },
      ]}
    />
  </section>
);
