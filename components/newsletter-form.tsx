"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const NewsletterForm = ({
  enabled,
}: {
  enabled: boolean;
}): React.JSX.Element => {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  if (!enabled)
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-medium">The mailing list is on its way</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          You can still browse every plugin. Accounts and suggestions never add
          you to a mailing list.
        </p>
      </div>
    );
  return (
    <form
      aria-label="Newsletter signup"
      className="ph-no-capture ph-no-autocapture rounded-xl border border-border bg-card p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        setSuccess(false);
        try {
          const response = await fetch("/api/subscriptions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), consent, website }),
          });
          const data = await response.json();
          if (!response.ok || typeof data.message !== "string")
            throw new Error(data.error ?? "Please try again shortly.");
          setSuccess(true);
          setMessage(data.message);
        } catch (error) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Please try again shortly.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <label
        htmlFor="newsletter-email"
        className="mb-2 block text-sm font-medium"
      >
        Email address
      </label>
      <Input
        id="newsletter-email"
        type="email"
        autoComplete="email"
        maxLength={254}
        required
        value={email}
        disabled={busy}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
      />
      <div className="hidden" aria-hidden="true">
        <label htmlFor="newsletter-website">Website</label>
        <input
          id="newsletter-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>
      <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed">
        <input
          type="checkbox"
          required
          checked={consent}
          disabled={busy}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-1 size-4 shrink-0 accent-sky-500"
        />
        I’d like occasional RoamJS emails about new plugins and useful changes.
        I can unsubscribe anytime.
      </label>
      <Button type="submit" disabled={busy} className="mt-5">
        {busy ? "Sending…" : "Send confirmation email"}
      </Button>
      <p className="mt-4 text-sm text-muted-foreground">
        No account needed. We’ll ask you to confirm your email before
        subscribing.{" "}
        <Link href="/privacy" className="underline">
          Privacy note
        </Link>
      </p>
      {message && (
        <p role={success ? "status" : "alert"} className="mt-4 text-sm">
          {message}
        </p>
      )}
    </form>
  );
};
