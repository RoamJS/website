"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const NewsletterChoice = ({
  token,
  action,
  enabled,
}: {
  token: string;
  action: "confirm" | "unsubscribe";
  enabled: boolean;
}): React.JSX.Element => {
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState("");
  const [unsubscribeToken, setUnsubscribeToken] = useState("");
  return (
    <section className="ph-no-capture ph-no-autocapture mt-6 rounded-xl border border-border bg-card p-6">
      <p>
        {action === "confirm"
          ? "Choose below to receive occasional RoamJS updates. This does not create an account."
          : "Choose below to stop receiving RoamJS updates. Your account and suggestions won’t change."}
      </p>
      {!complete && (
        <Button
          className="mt-5"
          disabled={busy || !enabled || !token}
          onClick={async () => {
            setBusy(true);
            setMessage("");
            try {
              const response = await fetch(`/api/subscriptions/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
              });
              const data = await response.json();
              if (!response.ok || typeof data.message !== "string")
                throw new Error(data.error ?? "Please try again.");
              setMessage(data.message);
              setComplete(true);
              if (typeof data.unsubscribeToken === "string")
                setUnsubscribeToken(data.unsubscribeToken);
            } catch (error) {
              setMessage(
                error instanceof Error ? error.message : "Please try again.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy
            ? "Saving…"
            : action === "confirm"
              ? "Confirm signup"
              : "Unsubscribe"}
        </Button>
      )}
      {!enabled && (
        <p className="mt-4 text-sm">This service is not available yet.</p>
      )}
      {enabled && !token && (
        <p className="mt-4 text-sm">
          This link is missing its verification details. Open the complete link
          from your email.
        </p>
      )}
      {message && (
        <p className="mt-4 text-sm" role={complete ? "status" : "alert"}>
          {message}
        </p>
      )}
      {unsubscribeToken && (
        <Link
          className="mt-4 block text-sm underline"
          href={`/updates/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`}
        >
          Changed your mind? Unsubscribe
        </Link>
      )}
      <Link href="/updates" className="mt-5 block text-sm underline">
        Back to Updates
      </Link>
    </section>
  );
};
