"use client";

import { useEffect } from "react";

const OauthPage = () => {
  useEffect(() => {
    const params = Object.fromEntries(
      new URLSearchParams(window.location.search).entries()
    );

    if (window.opener) {
      window.opener.postMessage(JSON.stringify(params), "*");
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