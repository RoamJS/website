"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Grid2X2,
  Lightbulb,
  Link2,
  Mail,
  Palette,
  Route,
  Search,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  categories,
  filterPlugins,
  plugins,
  type Category,
} from "@/lib/catalog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PluginIcon } from "./plugin-icon";

const categoryIcons: Record<Category, LucideIcon> = {
  "All plugins": Grid2X2,
  "Writing & thinking": Lightbulb,
  Productivity: Zap,
  Navigation: Route,
  Integrations: Link2,
  Appearance: Palette,
  "Developer tools": Code2,
};

export const Catalog = ({
  featured,
}: {
  featured: ReactNode;
}): React.JSX.Element => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All plugins");
  const [sort, setSort] = useState("popular");
  const searchRef = useRef<HTMLInputElement>(null);
  const results = filterPlugins({ query, category, sort });

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <>
      <section
        aria-labelledby="home-heading"
        className="pb-10 pt-6 text-center lg:pt-2"
      >
        <h1
          id="home-heading"
          className="text-balance text-4xl font-bold leading-[1.12] tracking-[-.045em] sm:text-5xl lg:text-[56px]"
        >
          A better way to work in <span className="text-primary">Roam.</span>
        </h1>
        <p className="mt-4 text-xl leading-relaxed text-muted-foreground sm:text-[32px]">
          More flow.{" "}
          <span className="relative inline-block">
            Less friction.
            <svg
              aria-hidden="true"
              className="absolute -bottom-1 left-0 h-2 w-full text-brand-orange"
              viewBox="0 0 200 8"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M2 5L193 2M10 7L198 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </p>
      </section>
      {featured}
      <section
        id="plugins"
        aria-labelledby="catalog-heading"
        className="scroll-mt-36 border-t pb-12 pt-6"
      >
        <div className="grid gap-6 md:grid-cols-[215px_minmax(0,1fr)] xl:grid-cols-[284px_minmax(0,1fr)] xl:gap-8">
          <aside
            aria-label="Plugin categories"
            className="flex flex-wrap content-start gap-1 md:flex-col md:border-r md:pr-5"
          >
            {categories.map((c) => {
              const Icon = categoryIcons[c];
              const active = category === c;
              return (
                <Button
                  key={c}
                  variant={active ? "secondary" : "ghost"}
                  className={`relative h-11 justify-start gap-4 px-4 text-sm font-normal md:w-full ${active ? "bg-accent text-primary before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-brand-orange" : "text-muted-foreground"}`}
                  aria-pressed={active}
                  onClick={() => setCategory(c)}
                >
                  <Icon
                    className={`size-5 shrink-0 ${active ? "text-brand-orange" : ""}`}
                  />
                  {c}
                  <span className="ml-auto tabular-nums text-muted-foreground">
                    {c === "All plugins"
                      ? plugins.length
                      : plugins.filter((p) => p.category === c).length}
                  </span>
                </Button>
              );
            })}
          </aside>
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div className="w-full min-w-0 xl:w-auto xl:flex-1">
                <h2 id="catalog-heading" className="sr-only">
                  Plugin catalog
                </h2>
                <form
                  role="search"
                  className="relative"
                  onSubmit={(event) => {
                    event.preventDefault();
                    document.getElementById("catalog-results")?.focus();
                  }}
                >
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 top-3 size-5 text-foreground"
                  />
                  <Input
                    ref={searchRef}
                    aria-label="Search plugins"
                    aria-controls="catalog-results"
                    placeholder="Search plugins"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="h-11 rounded-none border-0 border-b border-input bg-transparent pl-12 pr-11 text-lg! shadow-none focus-visible:border-primary focus-visible:ring-0 dark:bg-transparent"
                  />
                  {query ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-1 size-9"
                      onClick={() => {
                        setQuery("");
                        searchRef.current?.focus();
                      }}
                      aria-label="Clear search"
                    >
                      <X className="size-4" />
                    </Button>
                  ) : null}
                </form>
                <p role="status" className="mt-2 text-sm text-muted-foreground">
                  {results.length} {results.length === 1 ? "plugin" : "plugins"}
                  {query
                    ? ` matching “${query}”`
                    : category !== "All plugins"
                      ? ` in ${category.toLowerCase()}`
                      : ""}
                </p>
              </div>
              <div className="flex w-full flex-wrap items-center gap-x-5 gap-y-3 xl:w-auto">
                <Link
                  href="/ideas"
                  className="inline-flex items-center gap-2 text-sm text-brand-orange"
                >
                  <Lightbulb className="size-4" /> Share an idea
                </Link>
                <Link
                  href="/updates"
                  className="inline-flex items-center gap-2 text-sm text-primary"
                >
                  <Mail className="size-4" /> Get updates
                </Link>
                <div className="flex items-center gap-2">
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger
                      id="catalog-sort"
                      aria-label="Sort plugins"
                      className="h-9! w-[190px] bg-card text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" align="end">
                      <SelectItem value="name">Title (A–Z)</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="popular">
                        Downloads (high to low)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div
              id="catalog-results"
              role="region"
              aria-label="Plugin results"
              tabIndex={-1}
              className="scroll-mt-36"
            >
              {results.length ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {results.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/plugins/${p.slug}`}
                      className="group flex gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-primary/60"
                    >
                      <PluginIcon
                        slug={p.slug}
                        className="size-14 [&_svg]:size-7"
                      />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <h3 className="text-base font-semibold leading-tight">
                          {p.name}
                        </h3>
                        <p className="mt-1.5 grow text-[13px] leading-[1.45] text-muted-foreground">
                          {p.description}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="rounded-full bg-secondary px-2 py-1 text-[11px] text-secondary-foreground">
                            {p.slug === "static-site"
                              ? "Deprecated"
                              : p.category}
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm text-primary">
                            View{" "}
                            <ArrowRight
                              aria-hidden="true"
                              className="size-4 transition-transform group-hover:translate-x-1"
                            />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
                  <Search className="mb-4 size-7 text-muted-foreground" />
                  <h3 className="font-medium">No plugins found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try a different phrase or explore another category.
                  </p>
                  <Button
                    className="mt-5"
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      setCategory("All plugins");
                      searchRef.current?.focus();
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
