"use client";

import React, { useRef } from "react";
import { signOut } from "@/lib/server/actions";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import "@/i18n/config";
import { FaRightFromBracket } from "react-icons/fa6";

import LanguageAdmin from "./LanguageAdmin";
import ThemeAdmin from "./ThemeAdmin";
import Settings from "./settings/UserSettings";
import { FaUserCircle } from "react-icons/fa";
import NotificationList from "./notifications/NotificationList";

const Topbar = () => {
  const pathname = usePathname();
  const { t } = useTranslation();

  const dropdownRef = useRef<HTMLUListElement>(null);

  const pageTitles: Record<string, string> = {
    "/admin": t("overview"),
    "/admin/content": t("content"),
    "/admin/messages": t("customers"),
    "/admin/settings": t("settings"),
    "/admin/users": t("user_access"),
  };
  const currentTitle = pageTitles[pathname] || t("unknown_page");

  return (
    <div className="navbar bg-base-200 shadow-sm w-full rounded-md pl-5 h-14 flex items-center justify-between">
      <div className="flex-1">
        <a className="text-lg md:text-xl font-semibold tracking-wide">
          {currentTitle}
        </a>
      </div>
      <NotificationList />

      <div className="flex-none">
        <div className="dropdown dropdown-bottom dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost md:btn-md m-1 text-lg"
            aria-label={t("aria.topbar.moreOptions")}
          >
            <FaUserCircle size={24} />
          </div>
          <ul
            ref={dropdownRef}
            tabIndex={0}
            className="dropdown-content menu bg-base-200 border-2 border-base-300 rounded-box z-10 w-52 p-2 shadow-lg ring-1 ring-base-300 ring-opacity-5"
          >
            <li>
              <Settings />
            </li>
            <li>
              <ThemeAdmin />
            </li>
            <li>
              <LanguageAdmin />
            </li>
            <li>
              <button
                onClick={signOut}
                className="pl-[14px] flex items-center gap-2"
                aria-label={t("aria.topbar.logout")}
              >
                <FaRightFromBracket /> {t("logout")}
              </button>
            </li>

            <div className="flex-col gap-10 w-full p-4 flex">
              <span className="text-zinc-500 text-[11px] flex items-center gap-0.5">
                © {new Date().getFullYear()} Powered by{" "}
                <span className="font-bold">Arzonic</span>
              </span>
            </div>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
