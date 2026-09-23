import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import StoreProvider from "@/components/StoreProvider";
import { ThemeSync, themeBootstrapScript } from "@/components/ThemeSync";
import { MotionProvider } from "@/components/MotionProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HackkyHub",
  description: "Track every hackathon worth entering, across every platform.",
};

import { ConvexClientProvider } from "@/components/ConvexClientProvider";

import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Applies the saved theme before first paint to avoid a white flash. */}
          <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning
        >
          <ConvexClientProvider>
            <StoreProvider>
              <ThemeSync />
              <MotionProvider>{children}</MotionProvider>
            </StoreProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
