export const isAuthConfigured = (): boolean =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
// RJS-02 must migrate and verify persistence before submissions are enabled.
export const isCommunityConfigured = (): boolean =>
  isAuthConfigured() &&
  process.env.COMMUNITY_SUBMISSIONS_ENABLED === "true" &&
  Boolean(process.env.DATABASE_URL);
