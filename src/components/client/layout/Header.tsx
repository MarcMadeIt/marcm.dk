"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaBarsStaggered } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import LanguageAdmin from "@/components/admin/layout/LanguageAdmin";
import Language from "./Language";
import Image from "next/image";

const Header = () => {
  const pathname = usePathname();
  const { t } = useTranslation();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Håndter hash i URL når siden loader
    if (pathname === "/" && window.location.hash) {
      const hash = window.location.hash;
      const targetId = hash.replace("#", "");
      setTimeout(() => {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    }
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById("solutions-dropdown");
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCloseDrawer = () => {
    const drawerCheckbox = document.getElementById(
      "my-drawer-4",
    ) as HTMLInputElement | null;

    if (drawerCheckbox) drawerCheckbox.checked = false;
  };

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    hash: string,
  ) => {
    e.preventDefault();
    const targetId = hash.replace("#", "");

    // Hvis vi ikke er på hjemmesiden, naviger først
    if (pathname !== "/") {
      window.location.href = `/${hash}`;
      return;
    }

    // Scroll til elementet
    const scrollToElement = () => {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        // Opdater URL hash uden at trigge scroll igen
        window.history.pushState(null, "", hash);
      } else {
        // Hvis elementet ikke findes endnu, vent lidt og prøv igen
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
            window.history.pushState(null, "", hash);
          }
        }, 100);
      }
    };

    scrollToElement();
    handleCloseDrawer();
  };

  return (
    <div className="navbar fixed top-0 inset-x-0 z-50 max-w-7xl mx-auto rounded-lg-bottom bg-base-100/50 backdrop-blur-sm">
      <nav className="w-full flex ">
        <div className="navbar-start xl:pl-4">
          <div className="dropdown">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost lg:hidden text-lg"
            >
              <FaBarsStaggered />
            </div>
            <ul
              tabIndex={-1}
              className="menu dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
            >
              <li className="text-xl font-semibold">
                <Link
                  href="/#projects"
                  onClick={(e) => handleSmoothScroll(e, "#projects")}
                  aria-label={t("aria.navigation.linkToProjects")}
                >
                  {t("Header.projects")}
                </Link>
              </li>

              <li className="text-xl font-semibold">
                <Link
                  href="/#blog"
                  onClick={(e) => handleSmoothScroll(e, "#blog")}
                  aria-label={t("aria.navigation.linkToCases")}
                >
                  {t("Header.blog")}
                </Link>
              </li>

              <li className="text-xl font-semibold">
                <Link
                  href="/#contact"
                  onClick={(e) => handleSmoothScroll(e, "#contact")}
                  aria-label={t("aria.navigation.linkToContact")}
                >
                  {t("Header.contact")}
                </Link>
              </li>
            </ul>
          </div>
          <Link
            href="/"
            className=" text-xl flex items-center gap-2 font-medium"
          >
            <Image
              src="/logo.png"
              alt="Marc Møller"
              width={100}
              height={100}
              className="w-8 h-auto"
            />
            Marc Møller
          </Link>
        </div>
        {/* Center (desktop) */}
        <div className="navbar-center hidden md:flex">
          <ul className="menu menu-horizontal px-1">
            <li className="text-base font-semibold">
              <Link
                href="/#projects"
                onClick={(e) => handleSmoothScroll(e, "#projects")}
                aria-label={t("aria.navigation.linkToProjects")}
              >
                {t("Header.projects")}
              </Link>
            </li>
            <li className="text-base font-semibold">
              <Link
                href="/#blog"
                onClick={(e) => handleSmoothScroll(e, "#blog")}
                aria-label={t("aria.navigation.linkToCases")}
              >
                {t("Header.blog")}
              </Link>
            </li>
            <li className="text-base font-semibold">
              <Link
                href="/#contact"
                onClick={(e) => handleSmoothScroll(e, "#contact")}
                aria-label={t("aria.navigation.linkToContact")}
              >
                {t("Header.contact")}
              </Link>
            </li>
          </ul>
        </div>

        <div className="navbar-end pr-4">
          <div className="hidden md:block">
            <LanguageAdmin />
          </div>
          <div className="block md:hidden">
            <Language />
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Header;
