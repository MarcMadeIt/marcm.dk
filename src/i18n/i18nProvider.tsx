"use client";

import React, { useEffect, useState } from "react";
import i18n from "./config";
import { I18nextProvider } from "react-i18next";

export default function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (i18n.isInitialized) {
      setReady(true);
    } else {
      i18n.on("initialized", () => setReady(true));
    }
  }, []);

  if (!ready) {
    return <div className="p-4 text-center"></div>;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
