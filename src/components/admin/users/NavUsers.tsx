"use client";

import React from "react";
import Users from "../users/access/Users";
// import { FaExternalLinkAlt } from "react-icons/fa";
// import { FaUsers } from "react-icons/fa6";
const NavUsers = () => {
//   const [activeTab, setActiveTab] = useState("access");
//   const { t } = useTranslation();
  return (
    <div className="w-full">
        <Users />
      {/* <div role="tablist" className="tabs sm:tabs-lg w-full text-[15px]">
        <button
          role="tab"
          className={`tab gap-2  ${
            activeTab === "access"
              ? "tab-active bg-base-200 rounded-lg shadow-md"
              : ""
          }`}
          onClick={() => setActiveTab("access")}
          aria-label={t("aria.nav_users_access_tab")}
        >
        <FaUsers  />
          {t("user_settings")}
        </button>
        <button
          role="tab"
          className={`tab gap-2  ${
            activeTab === "test"
              ? "tab-active bg-base-200 rounded-lg shadow-md"
              : ""
          }`}
          onClick={() => setActiveTab("test")}
          aria-label={t("aria.nav_users_test_tab")}
        >
          <FaUsers />
          {t("test")}
        </button>
      </div>
      <div className="mt-3 md:mt-5 2xl:flex gap-3">
        <div className="flex-3/4 4xl:flex-3/5">
          {activeTab === "access" && (
            <div className="">
              <Users />
            </div>
          )}
          {activeTab === "test" && (
            <div className="">
              <Bookings />
            </div>
          )}
       
        </div>
        <div className="hidden 2xl:flex flex-1/4 4xl:flex-2/5 bg-base-200 rounded-box shadow-md p-5 md:p-7 h-fit">
          test
        </div>
      </div> */}
    </div>
  );
};

export default NavUsers;
