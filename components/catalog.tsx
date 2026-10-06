"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, X } from "lucide-react";
import { categories, filterPlugins, plugins } from "@/lib/catalog";
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
export const Catalog = (): React.JSX.Element => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All plugins");
  const [sort, setSort] = useState("popular");
  const results = filterPlugins({ query, category, sort });
  return (
    <section
      id="plugins"
      aria-labelledby="catalog-heading"
      className="scroll-mt-28 pb-20"
    >
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">MAKE ROAM YOUR OWN</p>
          <h2
            id="catalog-heading"
            className="text-3xl font-medium tracking-tight"
          >
            Find your next favorite tool<span className="text-primary">.</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            A library of possibilities, one plugin at a time.
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {plugins.length} plugins to explore
        </span>
      </div>
      <div className="mb-8 mt-7 flex flex-col gap-3 sm:flex-row">
        <div className="relative grow">
          <Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-muted-foreground" />
          <Input
            aria-label="Search plugins"
            placeholder="Search plugins, ideas, or things you want to do…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 bg-card pl-11 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 size-9"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger
            aria-label="Sort plugins"
            className="h-11! w-full bg-card sm:w-44"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most downloaded</SelectItem>
            <SelectItem value="name">Name: A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-7 md:grid-cols-[190px_1fr]">
        <aside
          aria-label="Plugin categories"
          className="flex flex-wrap content-start gap-1 md:flex-col"
        >
          <p className="eyebrow mb-3 hidden pl-3 md:block">Browse by purpose</p>
          {categories.map((c) => (
            <Button
              key={c}
              variant={category === c ? "secondary" : "ghost"}
              className="justify-between gap-3 px-3 text-xs font-normal md:w-full"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
              <span className="text-[10px] text-muted-foreground">
                {c === "All plugins"
                  ? plugins.length
                  : plugins.filter((p) => p.category === c).length}
              </span>
            </Button>
          ))}
          <div className="mt-7 hidden border-t px-3 pt-5 md:block">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Something missing?
            </p>
            <Link
              className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-primary"
              href="/ideas"
            >
              Plant an idea <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </aside>
        <div>
          <p role="status" className="mb-4 text-xs text-muted-foreground">
            {results.length} {results.length === 1 ? "plugin" : "plugins"}
            {query
              ? ` matching “${query}”`
              : category !== "All plugins"
                ? ` in ${category.toLowerCase()}`
                : " · made for your graph"}
          </p>
          {results.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((p) => (
                <Link
                  key={p.slug}
                  href={`/plugins/${p.slug}`}
                  className="group flex min-h-52 flex-col rounded-xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <PluginIcon slug={p.slug} />
                    <ArrowUpRight className="size-4 text-muted-foreground opacity-50 group-hover:text-primary group-hover:opacity-100" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{p.name}</h3>
                  <p className="mt-2 grow text-[13px] leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                  <div className="mt-5 flex flex-wrap justify-between gap-2 text-[10px] text-muted-foreground">
                    <span>{p.category}</span>
                    <span>
                      {p.slug === "static-site"
                        ? "Deprecated"
                        : p.depotId
                          ? "In Roam Depot"
                          : "View repository"}
                    </span>
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
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
