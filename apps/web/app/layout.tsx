import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { NavigationTracker } from "@/components/back-link";
import { MobileNavLoader } from "@/components/mobile-nav-loader";
import { NavProgress } from "@/components/nav-progress";
import { Toaster } from "@/components/toaster";
import { ThemeSync } from "@/components/theme-toggle";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Plus Jakarta Sans sets the wordmark (the owner's pick); Geist is the UI face.
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: "800" });
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

// metadataBase makes link-preview image URLs absolute. Set NEXT_PUBLIC_SITE_URL to the real address once deployed.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Nomrank",
  description: "Rate the dish, not the place. Rankings for every food, from the people who ate it.",
  openGraph: { siteName: "Nomrank", type: "website", locale: "en_IN" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf6ef" },
    { media: "(prefers-color-scheme: dark)", color: "#17111c" },
  ],
  viewportFit: "cover",
};

// Sets data-theme before first paint: the saved choice, else the device's setting. Dark is the fallback if this can't run.
const THEME_SCRIPT = `try{var t=localStorage.getItem("nomrank-theme");document.documentElement.dataset.theme=t==="light"||t==="dark"?t:matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${geist.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-background">
        {/* The pathname is request data, so it streams in rather than blocking the page shell. */}
        <Suspense fallback={null}>
          <NavigationTracker />
        </Suspense>
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>
        <ThemeSync />
        {children}
        <Suspense fallback={null}>
          <MobileNavLoader />
        </Suspense>
        <Suspense fallback={null}>
          <Toaster />
        </Suspense>
        {/* Vercel Web Analytics: cookieless page views. It reads the URL, so it streams in like the tracker above. */}
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        {/* Vercel Speed Insights: real user performance monitoring. */}
        <Suspense fallback={null}>
          <SpeedInsights />
        </Suspense>
      </body>
    </html>
  );
}
