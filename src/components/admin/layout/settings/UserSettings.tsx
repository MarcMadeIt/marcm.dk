"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { FaUserGear } from "react-icons/fa6";
import { useUserSettingsModal } from "./UserSettingsModalContext";

const UserSettings = () => {
  const { openModal } = useUserSettingsModal();
  const { t } = useTranslation();

  return (
    <button
      onClick={openModal}
      className="flex items-center gap-2 w-full text-left"
      aria-label={t("aria.settings.open")}
    >
      <FaUserGear className="text-lg" />
      <span className="text-sm">{t("profile_settings")}</span>
    </button>
  );
};

export default UserSettings;
