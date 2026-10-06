import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  GitFork,
  Sparkles,
  Sprout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Catalog } from "@/components/catalog";
import { Featured } from "@/components/featured";
const Home = (): React.JSX.Element => (
  <main id="main" className="mx-auto max-w-6xl px-5 md:px-8">
    <section className="grid items-center gap-8 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
      <div>
        <p className="eyebrow mb-6 flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-primary" /> INDEPENDENT
          TOOLS FOR CONNECTED THINKING
        </p>
        <h1 className="text-5xl font-medium leading-[1.08] tracking-[-.055em] sm:text-6xl lg:text-[72px]">
          Your notes.
          <br />
          More possibility<span className="text-primary">.</span>
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
          Make Roam feel a little more like you. Thoughtful plugins for the way
          you write, connect, and get things done.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="h-11 px-5">
            <Link href="#plugins">
              Explore the plugins <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" className="h-11">
            <Link href="/getting-started">
              New here? Start small <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
        <p className="mt-7 flex items-center gap-2 text-xs text-muted-foreground">
          <GitFork className="size-3.5" /> Open source. Built around your
          workflow.
        </p>
      </div>
      <div
        className="dot-paper relative mx-auto flex h-80 w-full max-w-md items-center justify-center rounded-full"
        aria-hidden="true"
      >
        <svg
          className="absolute inset-0 h-full w-full text-border"
          viewBox="0 0 400 320"
          fill="none"
        >
          <path
            d="M200 160L88 63M200 160L322 62M200 160L80 255M200 160L315 255"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />
          <circle
            cx="200"
            cy="160"
            r="108"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
        <div className="z-10 rotate-[-5deg] rounded-2xl border border-border bg-card px-8 py-7 shadow-sm">
          <p className="font-mono text-[11px] text-primary">
            [[your next idea]]
          </p>
          <div className="mt-3 h-1.5 w-28 rounded bg-muted" />
          <div className="mt-2 h-1.5 w-20 rounded bg-muted" />
        </div>
        <span className="absolute left-3 top-10 -rotate-12 rounded-lg border bg-[var(--sage)] px-4 py-3 text-xs text-[var(--feature-ink)]">
          ⌘ A better workflow
        </span>
        <span className="absolute right-0 top-8 rotate-6 rounded-lg border bg-[var(--lavender)] px-4 py-3 text-xs text-[var(--feature-ink)]">
          ↗ A new connection
        </span>
        <span className="absolute bottom-8 left-2 rotate-6 rounded-lg border bg-[var(--peach)] px-4 py-3 text-xs text-[var(--feature-ink)]">
          <Sparkles className="mr-1 inline size-3" /> A little less friction
        </span>
        <span className="absolute bottom-7 right-4 -rotate-6 rounded-lg border bg-card px-4 py-3 text-xs">
          + Room to think
        </span>
      </div>
    </section>
    <Featured />
    <Catalog />
    <section className="grid gap-8 border-y py-10 md:grid-cols-3">
      {[
        {
          Icon: BookOpen,
          title: "Start with one small thing",
          text: "Find a plugin that solves a real annoyance. You can always add more later.",
          href: "/getting-started",
          link: "How to get started",
        },
        {
          Icon: Sparkles,
          title: "Make it your own",
          text: "Every plugin has its own guide. Explore the settings and find what works for you.",
          href: "/#plugins",
          link: "Explore the library",
        },
        {
          Icon: Sprout,
          title: "Help shape what comes next",
          text: "The best ideas come from using the tools. Tell us what would make your day easier.",
          href: "/ideas",
          link: "Share an idea",
        },
      ].map(({ Icon, title, text, href, link }) => (
        <div key={title}>
          <Icon className="mb-4 size-5 text-primary" />
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {text}
          </p>
          <Link
            href={href}
            className="mt-4 inline-flex items-center gap-2 text-xs font-medium"
          >
            {link}
            <ArrowRight className="size-3" />
          </Link>
        </div>
      ))}
    </section>
    <section className="mt-16 flex flex-col justify-between gap-6 rounded-2xl bg-secondary px-7 py-9 sm:flex-row sm:items-center">
      <div>
        <p className="eyebrow mb-2">A NOTE, EVERY NOW AND THEN</p>
        <h2 className="text-2xl font-medium tracking-tight">
          Good things are growing.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          New tools, useful updates, and a little inspiration for your graph.
        </p>
      </div>
      <Button asChild variant="outline" className="h-11 shrink-0 bg-background">
        <Link href="/updates">
          Keep me in the loop <ArrowRight className="size-4" />
        </Link>
      </Button>
    </section>
  </main>
);
export default Home;
