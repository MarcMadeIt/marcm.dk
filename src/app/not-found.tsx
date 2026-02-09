"use client";

import { useTranslation } from "react-i18next";
import Footer from "@/components/client/layout/Footer";
import Header from "@/components/client/layout/Header";
import Link from "next/link";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="max-w-[1536px] mx-auto flex flex-col h-screen pt-[65px]">
      <Header />
      <div className="flex flex-col items-center justify-center grow text-center px-4">
        {/* we still render “404” as-is, but you could also translate it */}
        <h1 className="text-6xl font-bold text-primary">
          {t("notFound.title")}
        </h1>
        <p className="text-lg md:text-2xl font-bold mt-2">
          {t("notFound.message")}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <Link href="/" className="btn btn-primary md:text-lg">
            {t("notFound.home")}
          </Link>
          <Link
            href="/contact"
            className="btn btn-primary btn-outline md:text-lg"
          >
            {t("notFound.contact")}
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
