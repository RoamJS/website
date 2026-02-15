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
    const parsed = JSON.parse(decoded) as { origin?: string };
    return typeof parsed.origin === "string" ? parsed.origin : "";
  } catch {
    return "";
  }
};

const OauthPage = () => {
  useEffect(() => {
    const params = Object.fromEntries(
      new URLSearchParams(window.location.search).entries(),
    );

    if (window.opener) {
      const payload = JSON.stringify(params);
      const origins = new Set(TRUSTED_ORIGINS);

      const stateOrigin =
        typeof params.state === "string" ? decodeStateOrigin(params.state) : "";
      if (isTrustedOrigin(stateOrigin)) {
        origins.add(stateOrigin);
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
