export const isAuthConfigured = (): boolean =>
  Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY,
  );
export const isCommunityConfigured = (): boolean =>
  isAuthConfigured() && Boolean(process.env.DATABASE_URL);
