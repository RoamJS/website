import Link from "next/link";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { AuthButton } from "./auth-button";
import { isAuthConfigured } from "@/lib/features";
export const Header = (): React.JSX.Element => (
  <header className="sticky top-0 z-40 bg-background/95 backdrop-blur">
    <div className="mx-auto flex min-h-24 max-w-[1536px] flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-8 lg:py-2 xl:px-11">
      <Link href="/" aria-label="RoamJS home">
        <Brand />
      </Link>
      <nav
        aria-label="Main navigation"
        className="order-3 flex w-full items-center justify-center gap-7 pb-1 text-sm sm:order-none sm:mr-auto sm:ml-8 sm:w-auto sm:pb-0 lg:ml-12 lg:gap-12"
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
          className="hidden rounded-md border px-6 py-2.5 text-sm text-foreground hover:bg-accent md:block"
        >
          GitHub ↗
        </a>
      </div>
    </div>
  </header>
);
