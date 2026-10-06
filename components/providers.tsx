"use client";
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
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
      {children}
    </ThemeProvider>
  );
  return authEnabled ? <ClerkProvider>{content}</ClerkProvider> : content;
};
