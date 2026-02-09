import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import React from "react";
import I18nProvider from "@/i18n/i18nProvider";

const outfitSans = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Marc Møller",
    template: "%s - Marc Møller",
  },
  description:
    "Software Engineer focused on high-performance web applications, clean UI, and scalable architecture",
  metadataBase: new URL("https://marcm.dk"),
  manifest: "/manifest.json",
  openGraph: {
    title: "Marc Møller",
    description:
      "Software Engineer focused on high-performance web applications, clean UI, and scalable architecture",
    url: "https://marcm.dk",
    siteName: "Marc Møller",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Marc Møller OpenGraph preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Marc Møller",
    description:
      "Software Engineer focused on high-performance web applications, clean UI, and scalable architecture",
    images: ["/opengraph-image.png"],
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
};
export const viewport: Viewport = {
  themeColor: "#171717",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="marcdark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Marc Møller",
              url: "https://marcm.dk",
              logo: "https://marcm.dk/logo.png",
            }),
          }}
        />
      </head>
      <body className={outfitSans.className}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
