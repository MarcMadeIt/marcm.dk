"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaMoon } from "react-icons/fa6";
import { MdSunny } from "react-icons/md";

const ThemeAdmin = () => {
  const LIGHT_THEME = "arzoniclight";
  const DARK_THEME = "arzonicdark";

  const [isLight, setIsLight] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const currentTheme =
      storedTheme ??
      document.documentElement.getAttribute("data-theme") ??
      DARK_THEME;

    const themeToApply =
      currentTheme === LIGHT_THEME ? LIGHT_THEME : DARK_THEME;

    document.documentElement.setAttribute("data-theme", themeToApply);
    setIsLight(themeToApply === LIGHT_THEME);
  }, []);

  const toggleTheme = () => {
    const newTheme = isLight ? DARK_THEME : LIGHT_THEME;
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    setIsLight(!isLight);
  };

  return (
    <label className="swap swap-rotate justify-start">
      <input
        type="checkbox"
        checked={isLight}
        onChange={toggleTheme}
        className="hidden"
        aria-label={
          isLight ? t("aria.theme.switchToDark") : t("aria.theme.switchToLight")
        }
      />

      {/* sun icon (light mode) */}
      <div
        className="text-lg swap-off flex items-center gap-2"
        aria-label={t("aria.theme.switchToLight")}
      >
        <MdSunny className="" />
        <span className="text-sm">{t("light")}</span>
      </div>

      {/* moon icon (dark mode) */}
      <div
        className="text-lg swap-on flex items-center gap-2"
        aria-label={t("aria.theme.switchToDark")}
      >
        <FaMoon className="" />
        <span className="text-sm">{t("dark")}</span>
      </div>
    </label>
  );
};

export default ThemeAdmin;
