"use client";

import { useState } from "react";
import { FaGear, FaTags } from "react-icons/fa6";
import Tags from "./Tags/Tags";
import Settings from "./Settings/Settings";

type SettingsTab = "tags" | "settings";

const NavSettings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("tags");

  return (
    <div className="w-full">
      <div role="tablist" className="tabs sm:tabs-lg w-full text-[15px]">
        <button
          role="tab"
          className={`tab gap-2 ${
            activeTab === "tags"
              ? "tab-active bg-base-200 rounded-lg shadow-md"
              : ""
          }`}
          onClick={() => setActiveTab("tags")}
          aria-label="Tags-indstillinger"
        >
          <FaTags />
          Tags
        </button>
        <button
          role="tab"
          className={`tab gap-2 ${
            activeTab === "settings"
              ? "tab-active bg-base-200 rounded-lg shadow-md"
              : ""
          }`}
          onClick={() => setActiveTab("settings")}
          aria-label="Settings-indstillinger"
        >
          <FaGear />
          Settings
        </button>
      </div>
      <div className="mt-3">{activeTab === "tags" && <Tags />}</div>
      <div className="mt-3">{activeTab === "settings" && <Settings />}</div>
    </div>
  );
};

export default NavSettings;
