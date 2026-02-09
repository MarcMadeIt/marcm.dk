"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaFileLines,
  FaGear,
  FaHouse,
  FaRightFromBracket,
  FaUserGroup,
} from "react-icons/fa6";
import { readUserSession } from "@/lib/auth/readUserSession";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import "@/i18n/config";
import { FaShieldAlt } from "react-icons/fa";

const Navbar = () => {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    (async () => {
      const session = await readUserSession();
      if (session) {
        setRole(session.role);
      } else {
        setRole(null);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col items-center sm:justify-between bg-base-200 rounded-lg sm:fixed sm:h-full md:py-0 md:pr-0">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-start h-20 sm:h-22 w-full text-xl sm:pl-4 gap-2">
          <Image
            src="/logo.png"
            alt="App ikon"
            width={40}
            height={40}
            priority
          />
          <span className="font-semibold hidden sm:block">Dashboard</span>
        </div>
        <div className="hidden sm:flex">
          <ul className="menu menu-lg gap-2 rounded-box w-56 xl:w-72">
            {["admin", "developer"].includes(role || "") && (
              <li>
                <Link
                  className={pathname === "/admin" ? "menu-active" : ""}
                  href="/admin"
                  aria-label={t("aria.navigation.linkToOverview")}
                >
                  <FaHouse className="size-[1.1em] mr-[0.15rem]" />
                  {t("overview")}
                </Link>
              </li>
            )}
            <li>
              <Link
                className={pathname === "/admin/content" ? "menu-active" : ""}
                href="/admin/content"
                aria-label={t("aria.navigation.linkToContent")}
              >
                <FaFileLines className="size-[1.1em] mr-[0.15rem]" />
                {t("content")}
              </Link>
            </li>
            <li>
              <Link
                className={pathname === "/admin/messages" ? "menu-active" : ""}
                href="/admin/messages"
                aria-label={t("aria.navigation.linkToCustomers")}
              >
                <FaUserGroup className="size-[1.1em] mr-[0.15rem]" />
                {t("customers")}
              </Link>
            </li>
            {["admin", "developer"].includes(role || "") && (
              <li>
                <Link
                  href="/admin/users"
                  className={pathname === "/admin/users" ? "menu-active" : ""}
                  aria-label={t("aria.navigation.linkToUsers")}
                >
                  <FaShieldAlt className="size-[1.1em] mr-[0.15rem]" />
                  {t("user_access")}
                </Link>
              </li>
            )}
            {["admin", "developer"].includes(role || "") && (
              <li>
                <Link
                  className={
                    pathname === "/admin/settings" ? "menu-active" : ""
                  }
                  href="/admin/settings"
                  aria-label={t("aria.navigation.linkToSettings")}
                >
                  <FaGear className="size-[1.1em] mr-[0.15rem]" />
                  {t("settings")}
                </Link>
              </li>
            )}
          </ul>
        </div>
        <div className="dock dock-md sm:hidden z-30 bg-base-200">
          {["admin", "developer"].includes(role || "") && (
            <Link
              href="/admin"
              className={pathname === "/admin" ? "dock-active" : ""}
              aria-label={t("aria.navigation.linkToOverview")}
            >
              <FaHouse className="text-lg" />
            </Link>
          )}
          <Link
            href="/admin/content"
            className={pathname === "/admin/content" ? "dock-active" : ""}
            aria-label={t("aria.navigation.linkToContent")}
          >
            <FaFileLines className="text-lg" />
          </Link>
          <Link
            href="/admin/messages"
            className={pathname === "/admin/messages" ? "dock-active" : ""}
            aria-label={t("aria.navigation.linkToCustomers")}
          >
            <FaUserGroup className="text-lg" />
          </Link>
          {["admin", "developer"].includes(role || "") && (
            <Link
              href="/admin/users"
              className={pathname === "/admin/users" ? "dock-active" : ""}
              aria-label={t("aria.navigation.linkToUsers")}
            >
              <FaShieldAlt className="text-lg" />
            </Link>
          )}
          {["admin", "developer"].includes(role || "") && (
            <Link
              href="/admin/settings"
              className={pathname === "/admin/settings" ? "dock-active" : ""}
              aria-label={t("aria.navigation.linkToSettings")}
            >
              <FaGear className="text-lg" />
            </Link>
          )}
        </div>
      </div>
      <div className="flex-col gap-10 items-center justify-center w-full p-4 absolute bottom-12 hidden sm:flex">
        <Link
          href="/"
          className="btn btn-sm md:btn-md btn-soft flex items-center gap-2"
        >
          <span>{t("go_website")}</span>
          <FaRightFromBracket className="text-sm md:text-base" />
        </Link>
      </div>
      <div className="flex-col gap-10 items-center justify-center w-full p-4 absolute bottom-0 hidden sm:flex">
        <span className="text-zinc-500 text-[11px] flex items-center justify-center gap-0.5">
          © {new Date().getFullYear()} Powered by{" "}
          <span className="font-bold">Arzonic</span>
        </span>
      </div>
    </div>
  );
};

export default Navbar;
