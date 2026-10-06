"use client";
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
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
      {children}
    </ThemeProvider>
  );
  return authEnabled ? <ClerkProvider>{content}</ClerkProvider> : content;
};
