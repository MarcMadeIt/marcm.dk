"use client";

import React, { useState } from "react";
import Requests from "./requests/Requests";
import { FaCalendarCheck, FaClipboardCheck } from "react-icons/fa6";
import Bookings from "./bookings/Bookings";
import { useTranslation } from "react-i18next";

const NavMessages = () => {
  const [activeTab, setActiveTab] = useState("requests");
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <div
        role="tablist"
        className="tabs sm:tabs-lg w-full md:w-96 text-[15px]"
      >
        <button
          role="tab"
          className={`tab gap-2  ${
            activeTab === "requests"
              ? "tab-active bg-base-200 rounded-lg shadow-md"
              : ""
          }`}
          onClick={() => setActiveTab("requests")}
          aria-label={t("aria.navMessages.requestsTab")}
        >
          <FaClipboardCheck />
          {t("requests")}
        </button>
        <button
          role="tab"
          className={`tab gap-2  ${
            activeTab === "bookings"
              ? "tab-active bg-base-200 rounded-lg shadow-md"
              : ""
          }`}
          onClick={() => setActiveTab("bookings")}
          aria-label={t("aria.navMessages.bookingsTab")}
        >
          <FaCalendarCheck />
          Bookings
        </button>
      </div>

      <div className="mt-3">
        {activeTab === "requests" && (
          <div className="bg-base-200 rounded-lg shadow-md p-3 md:p-7">
            <Requests />
          </div>
        )}
        {activeTab === "bookings" && (
          <div className="bg-base-200 rounded-lg shadow-md p-3 md:p-7">
            <Bookings />
          </div>
        )}
      </div>
    </div>
  );
};

export default NavMessages;
