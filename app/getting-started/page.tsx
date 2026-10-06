import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
export const metadata = { title: "Get started" };
const GettingStarted = (): React.JSX.Element => (
  <main id="main" className="mx-auto max-w-3xl px-5 py-16">
    <p className="eyebrow">LESS SETUP. MORE THINKING.</p>
    <h1 className="mt-4 text-4xl font-medium tracking-tight">
      Start with one small thing.
    </h1>
    <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
      You don’t need a whole new system. Pick a plugin that makes one part of
      your day a little easier.
    </p>
    <ol className="mt-12 space-y-8">
      {[
        [
          "Find something useful",
          "Browse the library by purpose, or search for what you want to do. Read the plugin’s instructions and check any account or service requirements.",
        ],
        [
          "Open Roam Depot",
          "Inside your Roam graph, open Settings, then Roam Depot. Search for the plugin by name. Plugins marked “View repository” may have separate installation or development instructions.",
        ],
        [
          "Read, install, and make it yours",
          "Review the extension’s permissions and guide, install it, then explore its settings. Some integrations need an account with another service.",
        ],
        [
          "Keep what works",
          "Try it in your normal workflow. You can disable a plugin in Roam Depot whenever you like. If something could work better, suggest a change from its page.",
        ],
      ].map(([title, text], i) => (
        <li key={title} className="flex gap-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs">
            0{i + 1}
          </span>
          <div>
            <h2 className="text-lg font-medium">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {text}
            </p>
          </div>
        </li>
      ))}
    </ol>
    <Button asChild className="mt-10">
      <Link href="/#plugins">
        Find your first plugin
        <ArrowRight className="size-4" />
      </Link>
    </Button>
  </main>
);
export default GettingStarted;
