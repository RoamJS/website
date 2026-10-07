"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  inboxSchema,
  reviewReceiptSchema,
  reviewStatuses,
  replyLink,
  type InboxItem,
} from "@/lib/suggestion-inbox";
const statusLabel = (status: string): string =>
  status.charAt(0).toUpperCase() + status.slice(1);
const dateLabel = (date: string): string => new Date(date).toLocaleString();
const selectClass =
  "h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring";
const ReviewEditor = ({
  item,
  onSaved,
  onClose,
}: {
  item: InboxItem;
  onSaved: (updated: InboxItem) => void;
  onClose: () => void;
}): React.JSX.Element => {
  const [status, setStatus] = useState(item.status);
  const [note, setNote] = useState(item.follow_up_note);
  const [recordFollowUp, setRecordFollowUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const dirty =
    status !== item.status || note !== item.follow_up_note || recordFollowUp;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const save = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/suggestions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          version: item.version,
          status,
          note,
          recordFollowUp,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Could not save changes.");
      const saved = reviewReceiptSchema.parse(data);
      onSaved({ ...item, ...saved });
      setRecordFollowUp(false);
      setMessage("Changes saved.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save changes. Your draft is still here.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section
      className="rounded-xl border border-border bg-card p-5 sm:p-8"
      aria-label="Review suggestion"
    >
      <Button
        variant="ghost"
        disabled={busy}
        onClick={() => {
          if (
            !dirty ||
            window.confirm(
              "Discard your unsaved changes and return to the inbox?",
            )
          )
            onClose();
        }}
      >
        ← Back to inbox
      </Button>
      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>{item.plugin_slug ?? "New app idea"}</span>
        <span>Submitted {dateLabel(item.created_at)}</span>
      </div>
      <h2 className="mt-3 break-words text-2xl font-semibold">{item.title}</h2>
      <p className="mt-4 whitespace-pre-wrap break-words leading-relaxed">
        {item.body}
      </p>
      <div className="my-6 flex flex-wrap items-center gap-4">
        <span className="break-all text-sm text-muted-foreground">
          {item.email}
        </span>
        <Button asChild variant="outline">
          <a href={replyLink(item)}>Open email reply ↗</a>
        </Button>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Reply in your email app, then record the follow-up below. Opening a
        draft does not send or log a reply.
      </p>
      <form onSubmit={save} className="space-y-5">
        <label
          htmlFor="review-status"
          className="grid gap-2 text-sm font-medium"
        >
          Status
          <select
            id="review-status"
            aria-label="Status"
            className={selectClass}
            value={status}
            disabled={busy}
            onChange={(event) =>
              setStatus(event.target.value as InboxItem["status"])
            }
          >
            {reviewStatuses.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Private follow-up note
          <textarea
            rows={4}
            className="w-full rounded-md border border-input bg-background p-3 font-normal focus-visible:outline-2 focus-visible:outline-ring"
            value={note}
            disabled={busy}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What you discussed or what needs to happen next"
          />
        </label>
        <p className="text-xs text-muted-foreground">
          {Array.from(note).length} / 2000 characters
        </p>
        <label className="flex items-start gap-3 text-sm">
          <input
            className="mt-1 size-4"
            type="checkbox"
            checked={recordFollowUp}
            disabled={busy}
            onChange={(event) => setRecordFollowUp(event.target.checked)}
          />
          I sent a reply — record this follow-up when I save.
        </label>
        {item.followed_up_at && (
          <p className="text-sm text-muted-foreground">
            Last follow-up: {dateLabel(item.followed_up_at)}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
        <Button
          type="submit"
          disabled={busy || !dirty || Array.from(note).length > 2000}
        >
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </section>
  );
};
export const SuggestionInbox = (): React.JSX.Element => {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [selected, setSelected] = useState<InboxItem | null>(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [signIn, setSignIn] = useState(false);
  const [reload, setReload] = useState(0);
  const load = useCallback(
    async (signal: AbortSignal): Promise<void> => {
      setBusy(true);
      setError("");
      setSignIn(false);
      setItems([]);
      try {
        const params = new URLSearchParams({
          search: query,
          page: String(page),
        });
        if (status) params.set("status", status);
        const response = await fetch(`/api/admin/suggestions?${params}`, {
          cache: "no-store",
          signal,
        });
        const data = await response.json();
        if (!response.ok) {
          setSignIn(response.status === 401);
          throw new Error(data.error ?? "Could not load the inbox.");
        }
        if (signal.aborted) return;
        const result = inboxSchema.parse(data);
        setItems(result.items);
        setHasMore(data.hasMore === true);
      } catch (cause) {
        if (!signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load the inbox.",
          );
      } finally {
        if (!signal.aborted) setBusy(false);
      }
    },
    [status, query, page],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reload]);
  if (selected)
    return (
      <ReviewEditor
        key={selected.id}
        item={selected}
        onSaved={setSelected}
        onClose={() => {
          setSelected(null);
          setReload((value) => value + 1);
        }}
      />
    );
  return (
    <div className="space-y-6">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(0);
          setQuery(search.trim());
        }}
      >
        <Input
          aria-label="Search suggestions"
          placeholder="Search ideas, plugins, or email"
          value={search}
          maxLength={200}
          onChange={(event) => setSearch(event.target.value)}
          className="h-10 flex-1"
        />
        <select
          aria-label="Filter by status"
          className={selectClass}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(0);
          }}
        >
          <option value="">All statuses</option>
          {reviewStatuses.map((value) => (
            <option key={value} value={value}>
              {statusLabel(value)}
            </option>
          ))}
        </select>
        <Button type="submit" className="h-10">
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10"
          disabled={busy}
          onClick={() => setReload((value) => value + 1)}
        >
          Refresh
        </Button>
      </form>
      {busy ? (
        <p role="status">Loading suggestions…</p>
      ) : error ? (
        <div className="rounded-lg border border-border p-6">
          <p role="alert">{error}</p>
          {signIn && (
            <Link
              className="mt-4 inline-block text-primary underline"
              href="/account"
            >
              Sign in, then return to the inbox
            </Link>
          )}
        </div>
      ) : (
        <>
          {!items.length && (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <h2 className="font-medium">No suggestions here yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                New ideas will appear here. If you’re filtering, try another
                status or search.
              </p>
            </div>
          )}
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="w-full rounded-xl border border-border bg-card p-5 text-left transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                  onClick={() => setSelected(item)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                      {statusLabel(item.status)}
                    </span>
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={item.created_at}
                    >
                      {dateLabel(item.created_at)}
                    </time>
                  </div>
                  <h2 className="mt-3 break-words font-semibold">
                    {item.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 break-words text-sm text-muted-foreground">
                    {item.body}
                  </p>
                  <p className="mt-3 break-all text-xs text-muted-foreground">
                    {item.plugin_slug ?? "New app idea"} · {item.email}
                  </p>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1}
            </span>
            <Button
              variant="outline"
              disabled={!hasMore}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
