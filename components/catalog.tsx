"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Download,
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
const downloadFormatter = new Intl.NumberFormat("en-US");

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
        className="py-10 text-center md:py-12"
      >
        <h1
          id="home-heading"
          className="text-balance text-4xl font-semibold leading-[1.12] tracking-[-.045em] sm:text-5xl lg:text-6xl"
        >
          Become a <span className="text-primary">Roam Power User</span>
        </h1>
        <form
          role="search"
          className="relative mx-auto mt-7 max-w-2xl"
          onSubmit={(event) => {
            event.preventDefault();
            document.getElementById("catalog-heading")?.focus();
          }}
        >
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-5 top-4 size-5 text-foreground"
          />
          <Input
            ref={searchRef}
            aria-label="Search plugins"
            aria-controls="catalog-results"
            placeholder="Search plugins"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-13 rounded-xl bg-card pl-13 pr-14 text-base! shadow-xs"
          />
          {query ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 size-9"
              onClick={() => {
                setQuery("");
                searchRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              <X className="size-4" />
            </Button>
          ) : (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-4 rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              ⌘ K
            </span>
          )}
        </form>
      </section>
      {!query.trim() && featured}
      <section
        id="plugins"
        aria-labelledby="catalog-heading"
        className="scroll-mt-36 border-t pb-12 pt-6"
      >
        <div className="grid gap-6 md:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[235px_minmax(0,1fr)]">
          <aside
            aria-label="Plugin categories"
            className="flex flex-wrap content-start gap-1 md:flex-col md:border-r md:pr-5"
          >
            <p className="eyebrow mb-3 hidden pl-3 md:block">Browse plugins</p>
            {categories.map((c) => {
              const Icon = categoryIcons[c];
              const active = category === c;
              return (
                <Button
                  key={c}
                  variant={active ? "secondary" : "ghost"}
                  className={`relative h-11 justify-start gap-3 px-3 text-xs font-normal md:w-full ${active ? "bg-accent text-primary before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-brand-orange" : "text-muted-foreground"}`}
                  aria-pressed={active}
                  onClick={() => setCategory(c)}
                >
                  <Icon
                    className={`size-4 shrink-0 ${active ? "text-brand-orange" : ""}`}
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
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2
                  id="catalog-heading"
                  tabIndex={-1}
                  className="scroll-mt-36 text-2xl font-semibold tracking-tight"
                >
                  Plugin catalog
                </h2>
                <p role="status" className="mt-2 text-xs text-muted-foreground">
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
                  className="inline-flex items-center gap-1.5 text-xs text-brand-orange"
                >
                  <Lightbulb className="size-4" /> Share an idea
                </Link>
                <Link
                  href="/updates"
                  className="inline-flex items-center gap-1.5 text-xs text-primary"
                >
                  <Mail className="size-4" /> Get updates
                </Link>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="catalog-sort"
                    className="text-xs text-muted-foreground"
                  >
                    Sort by
                  </label>
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger
                      id="catalog-sort"
                      aria-label="Sort plugins"
                      className="h-10! w-[205px] bg-card text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" align="end">
                      <SelectItem value="name">Title (A–Z)</SelectItem>
                      <SelectItem value="popular">
                        Downloads (high to low)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div id="catalog-results">
              {results.length ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {results.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/plugins/${p.slug}`}
                      className="group flex gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/60"
                    >
                      <PluginIcon slug={p.slug} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <h3 className="text-sm font-semibold">{p.name}</h3>
                        <p className="mt-1.5 grow text-xs leading-relaxed text-muted-foreground">
                          {p.description}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                          <span className="rounded-full bg-secondary px-2 py-1 text-[10px] text-secondary-foreground">
                            {p.category}
                          </span>
                          <ArrowRight
                            aria-hidden="true"
                            className="size-4 text-primary transition-transform group-hover:translate-x-1"
                          />
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground">
                          {p.downloads !== null ? (
                            <>
                              <Download aria-hidden="true" className="size-3" />
                              <span>
                                {downloadFormatter.format(p.downloads)}{" "}
                                downloads
                              </span>
                            </>
                          ) : (
                            <span>
                              {p.slug === "static-site"
                                ? "Deprecated"
                                : "View repository"}
                            </span>
                          )}
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
