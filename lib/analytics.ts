import posthog from "posthog-js";
import {
  cleanAnalyticsUrl,
  isPublicAnalyticsPath,
  sanitizeAnalyticsEvent,
} from "./analytics-privacy";

// Public ingestion token for RoamJS project 648202; not a personal API credential.
const PROJECT_TOKEN = "phc_si5uzUuKYpRU7bytVpZ9z698TKR4gXcVF8fDDdNdKSbc";
const PRIVATE_UI =
  ".ph-no-capture, .ph-no-autocapture, [data-ph-no-autocapture], .cl-rootBox, .cl-portal, input, textarea, [contenteditable=true]";
let initialized = false;

type AnalyticsEvent =
  | "plugin clicked"
  | "carousel navigated"
  | "site link clicked"
  | "catalog filtered"
  | "catalog sorted"
  | "catalog searched";

export const trackEvent = (
  event: AnalyticsEvent,
  properties: Record<string, string | number | boolean>,
): void => {
  if (!initialized || !isPublicAnalyticsPath(window.location.pathname)) return;
  posthog.capture(event, properties);
};

const trackLinkClick = (event: MouseEvent): void => {
  if (event.type === "auxclick" && event.button !== 1) return;
  const target = event.target;
  if (!(target instanceof Element) || target.closest(PRIVATE_UI)) return;
  const link = target.closest<HTMLAnchorElement>("a[href]");
  if (!link) return;
  const destination = cleanAnalyticsUrl(link.href);
  if (!destination) return;
  const slide = link.closest<HTMLElement>("[data-carousel-slide]");
  const source =
    link.closest<HTMLElement>("[data-analytics-source]")?.dataset
      .analyticsSource ??
    (link.closest("header")
      ? "header"
      : link.closest("footer")
        ? "footer"
        : "content");
  const pluginSlug = link.dataset.pluginSlug;
  trackEvent(pluginSlug ? "plugin clicked" : "site link clicked", {
    destination,
    source,
    ...(pluginSlug
      ? {
          plugin_slug: pluginSlug,
          placement: link.dataset.pluginPlacement ?? "catalog",
        }
      : {}),
    ...(slide
      ? {
          carousel_slide: slide.dataset.carouselSlide ?? "",
          carousel_position: Number(slide.dataset.carouselPosition),
        }
      : {}),
    ...(window.location.pathname.startsWith("/plugins/")
      ? { current_plugin_slug: window.location.pathname.split("/")[2] }
      : {}),
  });
};

export const initializeAnalytics = (): void => {
  if (initialized || typeof window === "undefined") return;
  const enabled = process.env.NEXT_PUBLIC_POSTHOG_ENABLED;
  const hostname = window.location.hostname;
  const hosted =
    hostname === "roamjs.com" ||
    hostname.endsWith(".roamjs.com") ||
    hostname.endsWith(".vercel.app");
  if (enabled === "false" || (enabled !== "true" && !hosted)) return;
  if (!isPublicAnalyticsPath(window.location.pathname)) return;
  if (
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl ||
    navigator.doNotTrack === "1"
  )
    return;
  const environment =
    process.env.NEXT_PUBLIC_VERCEL_ENV ??
    (hostname.endsWith(".vercel.app")
      ? "preview"
      : hosted
        ? "production"
        : "development");
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || PROJECT_TOKEN, {
    api_host: "https://us.i.posthog.com",
    ui_host: "https://us.posthog.com",
    defaults: "2026-05-30",
    capture_pageview: "history_change",
    capture_pageleave: true,
    autocapture: {
      dom_event_allowlist: ["click"],
      element_allowlist: ["a", "button", "select"],
      css_selector_ignorelist: PRIVATE_UI.split(", "),
      element_attribute_ignorelist: [
        "href",
        "value",
        "title",
        "placeholder",
        "aria-label",
      ],
      capture_copied_text: false,
    },
    mask_all_text: true,
    person_profiles: "never",
    internal_or_test_user_hostname: null,
    persistence: "localStorage",
    save_campaign_params: false,
    save_referrer: false,
    disable_capture_url_hashes: true,
    respect_dnt: true,
    ip: false,
    disable_session_recording: true,
    enable_recording_console_log: false,
    capture_exceptions: false,
    capture_performance: false,
    capture_heatmaps: false,
    capture_dead_clicks: false,
    rageclick: false,
    disable_surveys: true,
    advanced_disable_flags: true,
    before_send: (event) => {
      const sanitized = sanitizeAnalyticsEvent(event);
      if (sanitized)
        Object.assign(sanitized.properties, {
          site: "roamjs-website",
          environment,
          analytics_version: 1,
        });
      return sanitized;
    },
  });
  initialized = true;
  document.addEventListener("click", trackLinkClick, true);
  document.addEventListener("auxclick", trackLinkClick, true);
};
