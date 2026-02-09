"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaAngleLeft,
  FaBell,
  FaKey,
  FaPalette,
  FaUserGear,
  FaXmark,
} from "react-icons/fa6";
import { useUserSettingsModal } from "./UserSettingsModalContext";
import ChangePassword from "./config/ChangePassword";
import UserDetails from "./config/UserDetails";
import PushNotificationToggle from "./notifications/PushNotificationToggle";
import Security from "./security/Security";


const UserSettingsModal = () => {
  const { dialogRef, closeModal } = useUserSettingsModal();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("user");
  const [showChangePassword, setShowChangePassword] = useState(false);

  const resetState = () => {
    setActiveTab("user");
    setShowChangePassword(false);
  };

  const handleClose = () => {
    resetState();
    closeModal();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleDialogClose = () => {
      resetState();
    };

    dialog.addEventListener("close", handleDialogClose);
    return () => dialog.removeEventListener("close", handleDialogClose);
  }, [dialogRef]);

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-5xl w-full h-full sm:h-[80vh] md:p-3 p-0 bg-base-100 rounded-lg shadow-lg flex flex-col gap-2">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-base-200 rounded-lg">
          <h3 className="font-bold text-xl md:text-2xl">
            {t("profile_settings")}
          </h3>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            aria-label={t("close")}
            onClick={handleClose}
          >
            <FaXmark size={24} />
          </button>
        </div>
        {/* Content with sidebar and main area */}
        <div className="flex flex-1 overflow-hidden gap-2">
          {/* Left Menu */}
          <div className="sm:flex-1 bg-base-200 p-3 overflow-y-auto rounded-lg">
            <ul className="menu menu-vertical sm:gap-4 gap-8">
              <li>
                <button
                  className={`${activeTab === "user" ? "menu-active" : ""}`}
                  onClick={() => {
                    setActiveTab("user");
                    setShowChangePassword(false);
                  }}
                >
                  <FaUserGear className="text-lg md:text-base" />{" "}
                  <span className="text-base hidden sm:block">
                    {t("user_profile")}
                  </span>
                </button>
              </li>
              <li>
                <button
                  className={`${
                    activeTab === "appearance" ? "menu-active" : ""
                  }`}
                  onClick={() => setActiveTab("appearance")}
                >
                  <FaPalette className="md:text-base text-lg" />{" "}
                  <span className="text-base hidden sm:block">
                    {t("appearance")}
                  </span>
                </button>
              </li>
              <li>
                <button
                  className={`${
                    activeTab === "notifications" ? "menu-active" : ""
                  }`}
                  onClick={() => setActiveTab("notifications")}
                >
                  <FaBell className="md:text-base text-lg" />{" "}
                  <span className="text-base hidden sm:block">
                    {t("notifications.title")}
                  </span>
                </button>
              </li>
              <li>
                <button
                  className={`${activeTab === "security" ? "menu-active" : ""}`}
                  onClick={() => setActiveTab("security")}
                >
                  <FaKey className="md:text-base text-lg" />{" "}
                  <span className="text-base hidden sm:block">
                    {t("security.title")}
                  </span>
                </button>
              </li>
            </ul>
          </div>

          {/* Right Content Area */}
          <div className="flex-4 p-5 md:p-7 bg-base-200 rounded-lg">
            <div className="h-full">
              {activeTab === "user" && (
                <div>
                  <h3 className="text-lg font-semibold mb-6 md:mb-10">
                    {t("user_profile")}
                  </h3>
                  {!showChangePassword ? (
                    <UserDetails
                      onChangePassword={() => setShowChangePassword(true)}
                    />
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <button
                          onClick={() => setShowChangePassword(false)}
                          className="btn btn-soft"
                          aria-label={t("aria.cases.back")}
                        >
                          <FaAngleLeft />
                          {t("back")}
                        </button>
                      </div>
                      <ChangePassword />
                    </div>
                  )}
                </div>
              )}
              {activeTab === "appearance" && (
                <div>
                  <h3 className="text-lg font-semibold mb-6 md:mb-10">
                    {t("appearance")}
                  </h3>
                  <p className="text-sm text-base-content/70">
                    {t("settings_content_coming_soon")}
                  </p>
                </div>
              )}
              {activeTab === "notifications" && (
                <div>
                  <h3 className="text-lg font-semibold mb-6 md:mb-10">
                    {t("notifications.title")}
                  </h3>
                  <PushNotificationToggle />
                </div>
              )}
              {activeTab === "security" && (
                <div>
                    <h3 className="text-lg font-semibold mb-6 md:mb-10">
                    {t("security.title")}
                  </h3>
                <Security />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={resetState}>
        <button aria-label={t("close")}>{t("close")}</button>
      </form>
    </dialog>
  );
};

export default UserSettingsModal;
