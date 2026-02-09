"use client";

import Script from "next/script";
import { DefaultSeo } from "next-seo";
import ScreenFade from "@/components/client/layout/ScreenFade";
import Header from "@/components/client/layout/Header";
import Footer from "@/components/client/layout/Footer";
import { useEffect, useState } from "react";
import { FaAngleUp } from "react-icons/fa6";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh sm:min-h-lvh">
      <Script
        async
        defer
        src="https://stats.marcm.dk/script.js"
        data-website-id="07686da1-b9ea-4c1c-a961-404432a84e2c"
      />
      <DefaultSeo
        titleTemplate="%s - Marc Møller"
        defaultTitle="Marc Møller - Software Engineer"
        description="Software Engineer focused on high-performance web applications, clean UI, and scalable architecture"
        openGraph={{
          type: "website",
          locale: "da_DK",
          url: "https://marcm.dk",
          siteName: "Marc Møller",
        }}
      />
      <div className="max-w-screen-2xl mx-auto pt-24">
        <Header />
        <main>{children}</main>
        <Footer />

        <ScreenFade />
      </div>
    </div>
  );
}
