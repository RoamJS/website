"use client";

import { useEffect } from "react";

const TRUSTED_ORIGINS = [
  "https://roamjs.com",
  "https://roamresearch.com",
  "https://beta.roamresearch.com",
  "https://app.roamresearch.com",
];

const getOrigin = (url: string) => {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
};

const isTrustedOrigin = (origin: string) => {
  if (!origin) {
    return false;
  }
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol === "https:" && hostname === "roamjs.com") {
      return true;
    }
    if (
      protocol === "https:" &&
      (hostname === "roamresearch.com" ||
        hostname.endsWith(".roamresearch.com"))
    ) {
      return true;
    }
    if (protocol === "app:" && hostname.endsWith("roamresearch.com")) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

const decodeStateOrigin = (state: string) => {
  try {
    const normalized = state.replace(/-/g, "+").replace(/_/g, "/");
    const padded =
      normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
    const decoded = window.atob(padded);
    const parsed = JSON.parse(decoded) as {
      origin?: string;
      session?: string;
    };
    return {
      origin: typeof parsed.origin === "string" ? parsed.origin : "",
      session: typeof parsed.session === "string" ? parsed.session : "",
    };
  } catch {
    return {
      origin: "",
      session: "",
    };
  }
};

const OauthPage = () => {
  useEffect(() => {
    const completeOauth = async () => {
      const params = Object.fromEntries(
        new URLSearchParams(window.location.search).entries(),
      );
      const stateData =
        typeof params.state === "string"
          ? decodeStateOrigin(params.state)
          : { origin: "", session: "" };

      if (stateData.session) {
        try {
          await fetch("/oauth/session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              session: stateData.session,
              code: typeof params.code === "string" ? params.code : "",
              state: typeof params.state === "string" ? params.state : "",
              error:
                typeof params.error === "string"
                  ? params.error
                  : typeof params.error_description === "string"
                    ? params.error_description
                    : "",
            }),
          });
        } catch {
          // Browser callback still shows completion text if registration fails.
        }
      }

      if (window.opener) {
        const payload = JSON.stringify(params);
        const origins = new Set(TRUSTED_ORIGINS);

        if (isTrustedOrigin(stateData.origin)) {
          origins.add(stateData.origin);
        }

        const referrerOrigin = getOrigin(document.referrer);
        if (isTrustedOrigin(referrerOrigin)) {
          origins.add(referrerOrigin);
        }

        origins.forEach((origin) => {
          window.opener?.postMessage(payload, origin);
        });
        window.close();
      }
    };
    void completeOauth();
  }, []);

  return (
    <main
      style={{
        display: "grid",
        minHeight: "100dvh",
        placeItems: "center",
        fontFamily: "system-ui, sans-serif",
        padding: 24,
        textAlign: "center",
      }}
    >
      Authentication complete. You can close this window.
    </main>
  );
};

export default OauthPage;

