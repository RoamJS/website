export const isAuthConfigured = (): boolean =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
// Enable only after the Supabase migration and hosted acceptance checks.
export const isSuggestionsConfigured = (): boolean =>
  isAuthConfigured() && process.env.COMMUNITY_SUBMISSIONS_ENABLED === "true";

// Remains unavailable until Supabase persistence and consent handling ship in RJS-04/05.
export const isNewsletterConfigured = (): boolean => false;
