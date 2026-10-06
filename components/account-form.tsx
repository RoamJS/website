"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { verifiedPrimaryEmail } from "@/lib/validation";
import { useAuth } from "./auth-provider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
export const AccountForm = (): React.JSX.Element => {
  const { user, enabled, isLoaded } = useAuth();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const run = async (action: () => Promise<void>): Promise<void> => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const send = async (): Promise<void> => {
    if (Date.now() < resendAt)
      throw new Error("Please wait a minute before requesting another email.");
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error)
      throw new Error(
        "We couldn’t send the sign-in email. Please wait a moment and try again.",
      );
    setSent(true);
    setResendAt(Date.now() + 60_000);
    setMessage(
      "Check your email for a verification code. You can also open the sign-in link in this browser.",
    );
  };
  const verify = async (): Promise<void> => {
    const { error } = await createClient().auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: "email",
    });
    if (error)
      throw new Error(
        "That code is invalid or expired. Try again or request a new email.",
      );
    setToken("");
  };
  const signOut = async (): Promise<void> => {
    const { error } = await createClient().auth.signOut({ scope: "local" });
    if (error) throw new Error("We couldn’t sign you out. Please try again.");
    setEmail("");
    setToken("");
    setSent(false);
    setResendAt(0);
    setMessage("You’re signed out.");
  };
  if (!enabled)
    return (
      <p>Sign-in isn’t available yet. You can still browse every plugin.</p>
    );
  if (!isLoaded) return <p role="status">Loading your account…</p>;
  return (
    <div
      className="space-y-5 rounded-xl border bg-card p-6"
      data-ph-no-autocapture
    >
      {user ? (
        <>
          <h2 className="text-xl font-medium">You’re signed in</h2>
          <p className="break-all text-sm">{user.email}</p>
          <p className="text-sm text-muted-foreground">
            {verifiedPrimaryEmail(user)
              ? "Your email is verified."
              : "Your email is not verified. Sign out and use the email sign-in flow to verify it."}
          </p>
          <Button
            disabled={busy}
            variant="outline"
            onClick={() => void run(signOut)}
          >
            {busy ? "Signing out…" : "Sign out"}
          </Button>
          <p>
            <Link href="/ideas" className="text-sm text-primary underline">
              Visit suggestions
            </Link>
          </p>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Sign in or create an account with your email. No password needed.
          </p>
          {search.has("error") && (
            <p role="alert" className="text-sm text-destructive">
              That sign-in link couldn’t be used. Request a new email and open
              it in this browser.
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(send);
            }}
            className="space-y-3"
          >
            <Label htmlFor="account-email">Email address</Label>
            <Input
              id="account-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              disabled={busy || sent}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" disabled={busy}>
              {busy
                ? "Please wait…"
                : sent
                  ? "Resend sign-in email"
                  : "Email me a sign-in code"}
            </Button>
          </form>
          {sent && (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(verify);
                }}
                className="space-y-3"
              >
                <Label htmlFor="account-code">Verification code</Label>
                <Input
                  id="account-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6,10}"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
                <Button type="submit" disabled={busy}>
                  Verify code
                </Button>
              </form>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  setSent(false);
                  setToken("");
                  setMessage("");
                  setError("");
                }}
              >
                Use a different email
              </Button>
            </>
          )}
        </>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Creating an account does not subscribe you to emails. Read our{" "}
        <Link href="/privacy" className="underline">
          privacy note
        </Link>
        .
      </p>
    </div>
  );
};
