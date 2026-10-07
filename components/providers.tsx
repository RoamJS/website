"use client";
import { ThemeProvider } from "next-themes";
import { InboxDraftProvider } from "./inbox-drafts";
import { AuthProvider } from "./auth-provider";
import { AnalyticsNavigation } from "./analytics-navigation";
export const Providers = ({
  children,
  authEnabled,
}: {
  children: React.ReactNode;
  authEnabled: boolean;
}): React.JSX.Element => {
  const content = (
    <ThemeProvider
      attribute="class"
      disableTransitionOnChange
      defaultTheme="dark"
      enableSystem
    >
      <AnalyticsNavigation />
      <InboxDraftProvider>{children}</InboxDraftProvider>
    </ThemeProvider>
  );
  return <AuthProvider enabled={authEnabled}>{content}</AuthProvider>;
};
