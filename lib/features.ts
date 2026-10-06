export const isAuthConfigured = (): boolean =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
// Enable only after the Supabase migration and hosted acceptance checks.
export const isSuggestionsConfigured = (): boolean =>
  isAuthConfigured() && process.env.COMMUNITY_SUBMISSIONS_ENABLED === "true";

// Newsletter signup has its own RJS-04/05 readiness and consent checks.
export const isNewsletterConfigured = (): boolean =>
  isAuthConfigured() &&
  process.env.NEWSLETTER_SIGNUP_ENABLED === "true" &&
  Boolean(process.env.DATABASE_URL);
