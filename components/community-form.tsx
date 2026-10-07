"use client";
import { suggestionSchema } from "@/lib/validation";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { AuthButton } from "./auth-button";
import { ArrowUpRight, CheckCircle2, Mail, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
type Props = {
  enabled: boolean;
  kind: "idea" | "subscription";
  pluginSlug?: string;
  pluginName?: string;
};
const ConnectedForm = ({
  kind,
  pluginSlug,
  pluginName,
}: Omit<Props, "enabled">): React.JSX.Element => {
  const { isLoaded, user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  if (!isLoaded)
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Loading your account…
      </p>
    );
  if (!user)
    return (
      <div className="rounded-xl border bg-card p-7">
        <Mail className="mb-4 size-6 text-primary" />
        <h3 className="text-lg font-medium">
          {kind === "idea"
            ? "Your idea starts here"
            : "A few good updates, in your inbox"}
        </h3>
        <p className="my-4 text-sm leading-relaxed text-muted-foreground">
          Sign in with a verified email{" "}
          {kind === "idea"
            ? "so we can follow up on your suggestion. Creating an account won’t add you to a mailing list."
            : "to choose whether you want occasional RoamJS announcements."}
        </p>
        <Button asChild>
          <Link href="/account">Sign in to continue</Link>
        </Button>
      </div>
    );
  const submit = async (subscribed?: boolean): Promise<void> => {
    const id = requestId ?? crypto.randomUUID();
    if (kind === "idea") {
      const parsed = suggestionSchema.safeParse({
        requestId: id,
        pluginSlug: pluginSlug ?? null,
        title,
        body,
      });
      if (!parsed.success) {
        setSuccess(false);
        setMessage(parsed.error.issues[0].message);
        return;
      }
    }
    setBusy(true);
    setMessage("");
    setSuccess(false);
    setRequestId(id);
    try {
      const response = await fetch(
        kind === "idea" ? "/api/suggestions" : "/api/subscriptions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            kind === "idea"
              ? { requestId: id, pluginSlug: pluginSlug ?? null, title, body }
              : { subscribed },
          ),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error ?? "Something went wrong. Please try again.",
        );
      if (kind === "idea" && (typeof result.id !== "string" || !result.id))
        throw new Error(
          "We couldn’t confirm your idea was saved. Please try again.",
        );
      setSuccess(true);
      setMessage(
        kind === "idea"
          ? "Your idea is saved. Thank you for helping shape RoamJS."
          : subscribed
            ? "You’re on the list. We’ll email you when there’s something to share."
            : "You’re unsubscribed from RoamJS announcements.",
      );
      if (kind === "idea") {
        setTitle("");
        setBody("");
        setRequestId(null);
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Please try again shortly.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      data-ph-no-autocapture
      className="space-y-5 rounded-xl border bg-card p-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit(kind === "subscription" ? true : undefined);
      }}
    >
      <div className="flex items-center justify-between gap-3 border-b pb-4">
        <p className="break-all text-xs text-muted-foreground">{user.email}</p>
        <AuthButton enabled />
      </div>
      {kind === "idea" ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="idea-title">
              {pluginName
                ? `Your idea for ${pluginName}`
                : "What would you like to see?"}
            </Label>
            <Input
              id="idea-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setRequestId(null);
              }}
              required
              disabled={busy}
              placeholder="A short title for your idea"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idea-body">Tell us a little more</Label>
            <Textarea
              id="idea-body"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setRequestId(null);
              }}
              required
              disabled={busy}
              className="min-h-36"
              placeholder="What are you trying to do? What would make it easier?"
            />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Your suggestion is private to RoamJS. We may reply to your verified
            email about this idea. Please don’t include private graph content.
          </p>
        </>
      ) : (
        <div className="flex items-start gap-3">
          <Checkbox
            id="updates-consent"
            checked={consent}
            onCheckedChange={(v) => setConsent(v === true)}
          />
          <Label htmlFor="updates-consent" className="text-sm leading-relaxed">
            Yes, email me occasional RoamJS announcements about new plugins and
            updates. I can unsubscribe here at any time.
          </Label>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={busy || (kind === "subscription" && !consent)}
        >
          {busy
            ? "Saving…"
            : kind === "idea"
              ? "Send suggestion"
              : "Subscribe to updates"}
        </Button>
        {kind === "subscription" && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void submit(false)}
          >
            Unsubscribe
          </Button>
        )}
      </div>
      {message && (
        <p
          role={success ? "status" : "alert"}
          className={`text-sm ${success ? "text-foreground" : "text-destructive"}`}
        >
          {success && <CheckCircle2 className="mr-2 inline size-4" />}
          {message}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Read our{" "}
        <Link className="underline" href="/privacy">
          privacy note
        </Link>
        .
      </p>
    </form>
  );
};
export const CommunityForm = ({
  enabled,
  ...props
}: Props): React.JSX.Element =>
  enabled ? (
    <ConnectedForm {...props} />
  ) : (
    <div className="rounded-xl border border-dashed bg-card p-7">
      <Sprout className="mb-4 size-6 text-primary" />
      <h3 className="text-lg font-medium">
        {props.kind === "idea"
          ? "A space for your ideas is growing"
          : "The mailing list is on its way"}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {props.kind === "idea"
          ? "Website suggestions aren’t open yet. In the meantime, you can share an idea through a GitHub issue."
          : "Email signup isn’t open yet. For now, you can follow plugin development and releases on GitHub."}
      </p>
      <Button asChild variant="outline" className="mt-5">
        <a
          href={
            props.kind === "idea"
              ? `https://github.com/RoamJS/${props.pluginSlug ?? "website"}/issues/new`
              : "https://github.com/RoamJS"
          }
        >
          {props.kind === "idea"
            ? "Share an idea on GitHub"
            : "Explore RoamJS on GitHub"}
          <ArrowUpRight className="size-4" />
        </a>
      </Button>
    </div>
  );
