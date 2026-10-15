"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme: "auto";
      size: "flexible";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

const turnstileApi = (): TurnstileApi | undefined =>
  (window as Window & { turnstile?: TurnstileApi }).turnstile;

export const AuthTurnstile = ({
  siteKey,
  onToken,
  onIssue,
  resetRef,
}: {
  siteKey: string;
  onToken: (token: string | null) => void;
  onIssue: (message: string) => void;
  resetRef: React.RefObject<(() => void) | null>;
}): React.JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    const api = turnstileApi();
    const container = containerRef.current;
    if (!scriptReady || !api || !container) return;

    let widgetId: string;
    try {
      widgetId = api.render(container, {
        sitekey: siteKey,
        theme: "auto",
        size: "flexible",
        callback: (token) => {
          onIssue("");
          onToken(token);
        },
        "expired-callback": () => {
          onToken(null);
          onIssue("Security check expired. Complete it again to get an email.");
          api.reset(widgetId);
        },
        "error-callback": () => {
          onToken(null);
          onIssue(
            "Security check failed. Retry it before requesting an email.",
          );
        },
      });
    } catch {
      onIssue("Security check could not load. Reload this page and try again.");
      return;
    }

    resetRef.current = () => api.reset(widgetId);
    return () => {
      resetRef.current = null;
      api.remove(widgetId);
    };
  }, [scriptReady, siteKey, onToken, onIssue, resetRef]);

  return (
    <div className="space-y-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() =>
          onIssue(
            "Security check could not load. Reload this page and try again.",
          )
        }
      />
      <div ref={containerRef} aria-label="Security check" />
      {!scriptReady && (
        <p className="text-sm text-muted-foreground">Loading security check…</p>
      )}
    </div>
  );
};
