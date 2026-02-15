"use client";

import { useEffect } from "react";

const TRUSTED_ORIGINS = ["https://roamjs.com", "https://roamresearch.com"];

const OauthPage = () => {
  useEffect(() => {
    const params = Object.fromEntries(
      new URLSearchParams(window.location.search).entries(),
    );

    if (window.opener) {
      const payload = JSON.stringify(params);
      TRUSTED_ORIGINS.forEach((origin) => {
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
