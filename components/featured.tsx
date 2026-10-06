import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ListTodo,
  Search,
  Terminal,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const WorkflowPreview = (): React.JSX.Element => (
  <div
    aria-hidden="true"
    className="relative mx-auto hidden w-full max-w-80 self-center py-8 sm:block"
  >
    <div className="rounded-lg border bg-background p-5 pb-16 text-xs shadow-sm">
      <p className="font-medium">• &nbsp; Meeting notes</p>
      <p className="mt-3 pl-4 text-muted-foreground">
        • &nbsp; Date: <span className="text-primary">[[Today]]</span>
      </p>
      <p className="mt-3 pl-4 text-muted-foreground">• &nbsp; Attendees:</p>
      <div className="ml-8 mt-3 h-1 w-20 rounded bg-border" />
    </div>
    <div className="relative -mt-12 ml-10 rounded-lg border bg-popover p-2 text-[11px] shadow-lg">
      <div className="flex items-center gap-2 rounded bg-accent px-2 py-2 text-primary">
        <WandSparkles className="size-3.5" /> Meeting notes
      </div>
      <div className="flex items-center gap-2 px-2 py-2 text-muted-foreground">
        <ListTodo className="size-3.5" /> Project update
      </div>
      <div className="flex items-center gap-2 px-2 py-2 text-muted-foreground">
        <CalendarDays className="size-3.5" /> Daily planning
      </div>
    </div>
    <p className="mt-3 text-right font-mono text-[10px] text-brand-orange">
      jj → your next workflow
    </p>
  </div>
);

export const Featured = (): React.JSX.Element => (
  <section aria-labelledby="featured-heading" className="pb-8">
    <h2 id="featured-heading" className="sr-only">
      Featured plugins
    </h2>
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <article className="grid gap-5 rounded-xl border bg-card px-6 py-7 sm:grid-cols-[1fr_1fr] xl:px-8">
        <div className="flex flex-col items-start justify-center">
          <p className="eyebrow mb-4">Featured plugin</p>
          <h3 className="text-4xl font-semibold tracking-[-.045em] xl:text-5xl">
            SmartBlocks
          </h3>
          <p className="mt-4 max-w-xs text-base leading-relaxed text-muted-foreground xl:text-lg">
            Create dynamic blocks, templates, and automations to work faster in
            Roam.
          </p>
          <Button asChild className="mt-7 h-11 px-5">
            <Link href="/plugins/smartblocks">
              View plugin <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
        <WorkflowPreview />
      </article>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {[
          {
            slug: "query-builder",
            name: "Query Builder",
            eyebrow: "Power up your notes",
            description:
              "Build complex queries with a simple, visual interface.",
            Icon: Search,
          },
          {
            slug: "workbench",
            name: "Workbench",
            eyebrow: "Make it yours",
            description: "A toolkit for everyday Roam workflows.",
            Icon: Terminal,
          },
        ].map(({ slug, name, eyebrow, description, Icon }) => (
          <Link
            key={slug}
            href={`/plugins/${slug}`}
            className="group flex items-center justify-between gap-5 rounded-xl border bg-card p-6 transition-colors hover:border-primary/60"
          >
            <div>
              <p className="eyebrow mb-2">{eyebrow}</p>
              <h3 className="text-xl font-semibold tracking-tight">{name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
              <span className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary">
                View plugin{" "}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
            <span
              className={`hidden size-16 shrink-0 items-center justify-center rounded-lg border bg-background/50 xl:flex ${slug === "workbench" ? "text-brand-orange" : "text-primary"}`}
            >
              <Icon className="size-8" strokeWidth={1.8} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  </section>
);
