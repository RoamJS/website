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
    <>
      <style>{`
        @keyframes cursorBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <main
        style={{
          display: "flex",
          minHeight: "100dvh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif',
          padding: 24,
          background: "#ffffff",
        }}
      >
        <div style={{ textAlign: "center", animation: "fadeIn 0.6s ease-out" }}>
          <div
            style={{
              position: "relative",
              display: "inline-block",
              marginBottom: 32,
            }}
          >
            <img
              src="https://avatars.githubusercontent.com/u/138642184"
              alt="RoamJS"
              width={80}
              height={80}
              draggable={false}
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                userSelect: "none",
              }}
            />
            <svg
              viewBox="0 0 36 36"
              style={{
                position: "absolute",
                top: -8,
                right: -12,
                width: 32,
                height: 32,
              }}
            >
              <circle cx="18" cy="18" r="18" fill="#222222" />
              <path
                d="M10 18l5 5 11-11"
                stroke="white"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#37352f",
              letterSpacing: "-0.03em",
              margin: 0,
              marginBlockEnd: 12,
            }}
          >
            Google Account Connected to Roam Research
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "#787774",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            You can now close this window and return to{" "}
            <span style={{ display: "inline-block", position: "relative" }}>
              <span
                style={{
                  display: "inline-block",
                  background: "#f7f6f3",
                  border: "1px solid #e3e2e0",
                  borderRadius: 4,
                  padding: "2px 8px",
                  fontFamily:
                    '"SFMono-Regular", Menlo, Consolas, monospace',
                  fontSize: 14,
                  color: "#37352f",
                }}
              >
                Roam
                <span
                  style={{
                    display: "inline-block",
                    width: 3,
                    height: 17,
                    background: "#222222",
                    marginLeft: 2,
                    verticalAlign: "text-bottom",
                    animation: "cursorBlink 1.2s step-end infinite",
                  }}
                />
              </span>
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 6,
                }}
              >
                <svg
                  viewBox="0 0 60 8"
                  preserveAspectRatio="none"
                  style={{ width: "100%", height: "100%" }}
                >
                  <path
                    d="M2 2.5 Q15 1.5, 30 2.8 T58 2"
                    stroke="#222222"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M3 5.5 Q20 4.2, 35 5.8 T57 5"
                    stroke="#222222"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </span>
          </p>
        </div>
      </main>
    </>
  );
};

export default OauthPage;

