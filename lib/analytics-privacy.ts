import type { CaptureResult } from "posthog-js";

export const isPublicAnalyticsPath = (pathname: string): boolean =>
  ["/", "/getting-started", "/ideas", "/updates", "/privacy"].includes(
    pathname,
  ) || /^\/plugins\/[a-z0-9-]+\/?$/.test(pathname);

export const cleanAnalyticsUrl = (value: string): string => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? `${url.origin}${url.pathname}`
      : "";
  } catch {
    return "";
  }
};

export const sanitizeAnalyticsEvent = (
  event: CaptureResult | null,
): CaptureResult | null => {
  if (!event) return null;
  delete event.$set;
  delete event.$set_once;
  const properties = event.properties;
  const currentUrl = properties.$current_url;
  if (typeof currentUrl !== "string") return null;
  try {
    if (!isPublicAnalyticsPath(new URL(currentUrl).pathname)) return null;
  } catch {
    return null;
  }
  for (const key of Object.keys(properties)) {
    if (
      key === "$set" ||
      key === "$set_once" ||
      /^(utm_|\$initial_)/.test(key)
    ) {
      delete properties[key];
    } else if (
      /url|referrer|href/i.test(key) &&
      typeof properties[key] === "string"
    ) {
      properties[key] = cleanAnalyticsUrl(properties[key]);
    }
  }
  return event;
};
