import type { Metadata } from "next";
import { Caveat, Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { isAuthConfigured } from "@/lib/features";
import "./globals.css";
const handwriting = Caveat({
  variable: "--font-handwriting",
  subsets: ["latin"],
  weight: "500",
});
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: {
    default: "RoamJS — Become a Roam Power User",
    template: "%s · RoamJS",
  },
  description:
    "Discover the RoamJS plugin library. Tools, guides, and ideas for a more personal Roam Research workflow.",
};
const RootLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element => (
  <html lang="en" suppressHydrationWarning>
    <body
      className={`${geistSans.variable} ${geistMono.variable} ${handwriting.variable} antialiased`}
    >
      <Providers authEnabled={isAuthConfigured()}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        {children}
        <Footer />
      </Providers>
    </body>
  </html>
);
export default RootLayout;
