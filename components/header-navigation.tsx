"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Popover } from "radix-ui";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { AuthButton } from "./auth-button";
import { Button } from "./ui/button";

const links = [
  { href: "/#plugins", label: "Plugins" },
  { href: "/getting-started", label: "Get started" },
  { href: "/ideas", label: "Suggest an idea" },
];

const subscribeToScroll = (onChange: () => void): (() => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
};
const isScrolled = (): boolean => window.scrollY > 48;
const isInitiallyScrolled = (): boolean => false;

const GitHubIcon = (): React.JSX.Element => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    fill="currentColor"
    className="size-4 shrink-0"
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

export const HeaderNavigation = ({
  authEnabled,
}: {
  authEnabled: boolean;
}): React.JSX.Element => {
  const compact = useSyncExternalStore(
    subscribeToScroll,
    isScrolled,
    isInitiallyScrolled,
  );
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = (): void => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    // Reserve the expanded height so shrinking the fixed header cannot shift page content.
    <div className="h-16 lg:h-24">
      <header
        data-compact={compact}
        className={`fixed inset-x-0 top-0 z-40 bg-background/95 backdrop-blur transition-shadow duration-200 motion-reduce:transition-none ${compact ? "shadow-sm" : ""}`}
      >
        <div
          className={`mx-auto flex max-w-[1536px] items-center justify-between gap-2 px-5 transition-[height] duration-200 motion-reduce:transition-none md:px-8 xl:px-11 ${compact ? "h-14 lg:h-16" : "h-16 lg:h-24"}`}
        >
          <Link
            href="/"
            aria-label="RoamJS home"
            className="shrink-0"
            onClick={() => setMenuOpen(false)}
          >
            <Brand compact={compact} />
          </Link>
          <nav
            aria-label="Main navigation"
            className="mr-auto ml-8 hidden items-center gap-7 text-sm lg:flex xl:ml-12 xl:gap-12"
          >
            {links.map(({ href, label }) => (
              <Link key={href} className="nav-link" href={href}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1 lg:gap-3">
            <ThemeToggle />
            <div className="hidden lg:block">
              <AuthButton enabled={authEnabled} />
            </div>
            <a
              href="https://github.com/RoamJS"
              className="hidden items-center gap-2 rounded-md border px-5 py-2 text-sm text-foreground hover:bg-accent lg:inline-flex"
            >
              <GitHubIcon /> GitHub ↗
            </a>
            <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
              <Popover.Trigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 lg:hidden"
                  aria-label="Open navigation menu"
                  data-attr="navigation-open"
                >
                  <Menu className="size-5" />
                </Button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  align="end"
                  sideOffset={8}
                  collisionPadding={16}
                  aria-label="Navigation menu"
                  className="z-50 w-[calc(100vw-2rem)] max-w-sm overflow-y-auto rounded-xl border bg-background p-3 text-foreground shadow-lg outline-none max-h-[calc(100dvh-5rem)]"
                >
                  <div className="flex items-center justify-between pl-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      Navigation
                    </span>
                    <Popover.Close asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-11"
                        aria-label="Close navigation menu"
                        data-attr="navigation-close"
                      >
                        <X className="size-5" />
                      </Button>
                    </Popover.Close>
                  </div>
                  <nav aria-label="Mobile navigation" className="grid gap-1">
                    {links.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className="flex min-h-11 items-center rounded-md px-3 text-base hover:bg-accent"
                      >
                        {label}
                      </Link>
                    ))}
                    <a
                      href="https://github.com/RoamJS"
                      onClick={() => setMenuOpen(false)}
                      className="flex min-h-11 items-center gap-2 rounded-md px-3 text-base hover:bg-accent"
                    >
                      <GitHubIcon /> GitHub ↗
                    </a>
                  </nav>
                  {authEnabled && (
                    <div className="mt-3 border-t px-3 pt-3">
                      <AuthButton enabled={authEnabled} />
                    </div>
                  )}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
        </div>
      </header>
    </div>
  );
};
