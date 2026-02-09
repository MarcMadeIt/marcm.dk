"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const Language = () => {
  const { i18n, t } = useTranslation();
  const [isEnglish, setIsEnglish] = useState(
    () => i18n.resolvedLanguage?.startsWith("en") ?? true,
  );

  useEffect(() => {
    void i18n.changeLanguage(isEnglish ? "en" : "da");
  }, [isEnglish, i18n]);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setIsEnglish(lng.startsWith("en"));
    };

    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n]);

  return (
    <label className="swap swap-rotate cursor-pointer">
      <input
        type="checkbox"
        checked={isEnglish}
        onChange={(event) => setIsEnglish(event.target.checked)}
      />
      <span
        className="swap-on "
        aria-label={t(
          "aria.language.changeToDanish",
          "Change language to Danish",
        )}
      >
        <Image
          src="/DK.png"
          alt="Skift til Dansk"
          width={35}
          height={35}
          className="w-7 h-auto opacity-80"
        />
      </span>
      <span
        className="swap-off"
        aria-label={t(
          "aria.language.changeToEnglish",
          "Change language to English",
        )}
      >
        <Image
          src="/UK.png"
          alt="Change to English"
          width={35}
          height={35}
          className="w-7 h-auto opacity-80"
        />
      </span>
    </label>
  );
};

export default Language;
