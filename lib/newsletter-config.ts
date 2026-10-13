import "server-only";

export const isNewsletterPersistenceConfigured = (): boolean =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_NEWSLETTER_SECRET_KEY?.startsWith("sb_secret_") &&
    (process.env.NEWSLETTER_LINK_SECRET?.length ?? 0) >= 32,
  );

export const isNewsletterSignupConfigured = (): boolean => {
  try {
    const site = new URL(process.env.NEWSLETTER_SITE_URL ?? "");
    const safeOrigin =
      !site.username &&
      !site.password &&
      (site.protocol === "https:" ||
        (site.protocol === "http:" && site.hostname === "localhost"));
    return Boolean(
      process.env.NEWSLETTER_SIGNUP_ENABLED === "true" &&
      isNewsletterPersistenceConfigured() &&
      process.env.RESEND_API_KEY &&
      safeOrigin,
    );
  } catch {
    return false;
  }
};
