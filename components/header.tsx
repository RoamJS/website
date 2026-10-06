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
          className="hidden items-center gap-2 rounded-md border px-6 py-2.5 text-sm text-foreground hover:bg-accent md:inline-flex"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="size-4 shrink-0"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
          GitHub ↗
        </a>
      </div>
    </div>
  </header>
);
