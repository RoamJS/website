import Link from "next/link";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { AuthButton } from "./auth-button";
import { isAuthConfigured } from "@/lib/features";
export const Header = (): React.JSX.Element => (
  <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
    <div className="mx-auto flex min-h-20 max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-8">
      <Link href="/" aria-label="RoamJS home">
        <Brand />
      </Link>
      <nav
        aria-label="Main navigation"
        className="order-3 flex w-full items-center justify-center gap-7 pb-1 text-sm sm:order-none sm:w-auto sm:pb-0"
      >
        <Link className="nav-link" href="/#plugins">
          Plugins
        </Link>
        <Link className="nav-link" href="/getting-started">
          Get started
        </Link>
        <Link className="nav-link" href="/ideas">
          Suggest an idea
        </Link>
      </nav>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <AuthButton enabled={isAuthConfigured()} />
        <a
          href="https://github.com/RoamJS"
          className="hidden text-sm text-muted-foreground hover:text-foreground md:block"
        >
          GitHub ↗
        </a>
      </div>
    </div>
  </header>
);
