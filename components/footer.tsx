import Link from "next/link";
import { Brand } from "./brand";
export const Footer = (): React.JSX.Element => (
  <footer className="mx-auto max-w-6xl px-5 pb-8 pt-16 md:px-8">
    <div className="flex flex-col justify-between gap-8 border-t border-border pt-9 md:flex-row">
      <div>
        <Link href="/">
          <Brand />
        </Link>
        <p className="mt-3 text-sm text-muted-foreground">
          Little tools. More room to think.
        </p>
      </div>
      <nav
        aria-label="Footer navigation"
        className="flex flex-wrap gap-6 text-sm text-muted-foreground"
      >
        <Link href="/getting-started">Documentation</Link>
        <Link href="/updates">Updates</Link>
        <Link href="/privacy">Privacy</Link>
        <a href="https://github.com/RoamJS">Open source ↗</a>
      </nav>
    </div>
    <p className="mt-10 text-xs text-muted-foreground">
      Built for the Roam Research community. RoamJS is an independent project.
    </p>
  </footer>
);
