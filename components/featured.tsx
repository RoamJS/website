import Link from "next/link";
import { ArrowUpRight, Check, Plus, Sparkles } from "lucide-react";
import { PluginIcon } from "./plugin-icon";
export const Featured = (): React.JSX.Element => (
  <section aria-labelledby="featured-heading" className="pb-20">
    <div className="mb-6 flex items-end justify-between">
      <div>
        <p className="eyebrow mb-2">A FEW GOOD PLACES TO START</p>
        <h2
          id="featured-heading"
          className="text-2xl font-medium tracking-tight"
        >
          Small additions. Big possibilities.
        </h2>
      </div>
      <span className="hidden text-xs text-muted-foreground sm:block">
        The RoamJS essentials
      </span>
    </div>
    <div className="grid gap-5 md:grid-cols-2">
      <Link
        href="/plugins/smartblocks"
        className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/60"
      >
        <div
          className="relative h-52 overflow-hidden bg-[var(--sage)] p-7"
          aria-hidden="true"
        >
          <div className="absolute right-6 top-5 text-[10px] uppercase tracking-widest text-[var(--feature-ink)]/65">
            Workflow illustration
          </div>
          <div className="mx-auto mt-6 max-w-72 rotate-[-3deg] rounded-lg border border-border bg-card p-5 shadow-sm transition group-hover:rotate-0">
            <div className="flex justify-between border-b pb-3 text-xs font-medium">
              <span>My morning, on autopilot</span>
              <Sparkles className="size-4 text-primary" />
            </div>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              <p className="flex gap-2">
                <Check className="size-3.5 text-primary" /> Today’s priorities
              </p>
              <p className="flex gap-2">
                <Check className="size-3.5 text-primary" /> A prompt to get me
                thinking
              </p>
              <p className="flex gap-2">
                <Plus className="size-3.5" /> Room for something unexpected
              </p>
            </div>
          </div>
          <span className="absolute bottom-4 right-6 rounded-md bg-[var(--feature-ink)] px-3 py-1.5 font-mono text-[10px] text-[var(--sage)]">
            jj → your next workflow
          </span>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <PluginIcon slug="smartblocks" />
            <div>
              <h3 className="font-semibold">SmartBlocks</h3>
              <p className="text-xs text-muted-foreground">
                Templates with a little superpower
              </p>
            </div>
            <ArrowUpRight className="ml-auto size-5 text-muted-foreground transition group-hover:text-primary" />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Turn the things you do every day into workflows that practically
            write themselves.
          </p>
        </div>
      </Link>
      <Link
        href="/plugins/query-builder"
        className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/60"
      >
        <div
          className="relative h-52 overflow-hidden bg-[var(--lavender)] p-7"
          aria-hidden="true"
        >
          <div className="absolute right-6 top-5 text-[10px] uppercase tracking-widest text-[var(--feature-ink)]/65">
            Workflow illustration
          </div>
          <div className="mx-auto mt-6 max-w-80 rotate-[2deg] rounded-lg border border-border bg-card p-4 shadow-sm transition group-hover:rotate-0">
            <div className="flex items-center gap-2 border-b pb-3 text-[11px]">
              <span className="rounded bg-secondary px-2 py-1">Find notes</span>
              <span className="text-muted-foreground">tagged</span>
              <span className="rounded bg-[var(--lavender)] px-2 py-1">
                #ideas
              </span>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span>A quieter kind of productivity</span>
                <span className="text-muted-foreground">↗</span>
              </div>
              <div className="flex justify-between">
                <span>Notes on a connected world</span>
                <span className="text-muted-foreground">↗</span>
              </div>
              <div className="h-1.5 w-36 rounded bg-muted" />
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <PluginIcon slug="query-builder" />
            <div>
              <h3 className="font-semibold">Query Builder</h3>
              <p className="text-xs text-muted-foreground">
                Make more of what you already know
              </p>
            </div>
            <ArrowUpRight className="ml-auto size-5 text-muted-foreground transition group-hover:text-primary" />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Surface the right notes, explore relationships, and turn a growing
            graph into useful answers.
          </p>
        </div>
      </Link>
    </div>
  </section>
);
