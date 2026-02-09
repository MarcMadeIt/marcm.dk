"use client";

import React, { useEffect, useState } from "react";
import { FaRegNewspaper, FaSuitcase } from "react-icons/fa6";
import Projects from "./projects/Projects";

import { useTranslation } from "react-i18next";
import Blog from "./blog/Blog";
import { getProjectsCount, getBlogsCount } from "@/lib/server/actions";

const NavContent = () => {
  const [activeTab, setActiveTab] = useState("blog");
  const { t } = useTranslation();
  const [blogCount, setBlogCount] = useState<number | null>(null);
  const [projectsCount, setProjectsCount] = useState<number | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchCounts = async () => {
      try {
        const [blogTotal, projectsTotal] = await Promise.all([
          getBlogsCount(),
          getProjectsCount(),
        ]);

        if (isActive) {
          setBlogCount(blogTotal);
          setProjectsCount(projectsTotal);
        }
      } catch (error) {
        console.error("Failed to fetch content counts:", error);
        if (isActive) {
          setBlogCount(0);
          setProjectsCount(0);
        }
      }
    };

    fetchCounts();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="w-full">
      <div role="tablist" className="tabs sm:tabs-lg w-full  text-[15px]">
        <button
          role="tab"
          className={`tab gap-2  ${
            activeTab === "blog"
              ? "tab-active bg-base-200 rounded-lg shadow-md"
              : ""
          }`}
          onClick={() => setActiveTab("blog")}
          aria-label={t("aria.navContent.reviewsTab")}
        >
          <FaRegNewspaper />
          {t("blog_more")}
        </button>
        <button
          role="tab"
          className={`tab gap-2  ${
            activeTab === "projects"
              ? "tab-active bg-base-200 rounded-lg shadow-md"
              : ""
          }`}
          onClick={() => setActiveTab("projects")}
          aria-label={t("aria.navContent.projectsTab")}
        >
          <FaSuitcase />
          Projects
        </button>
      </div>
      <div className="mt-3 2xl:flex gap-3">
        <div className="flex-3/4 4xl:flex-5/6">
          {activeTab === "blog" && (
            <div className="bg-base-200 rounded-lg shadow-md p-5 md:p-7">
              <Blog />
            </div>
          )}
          {activeTab === "projects" && (
            <div className="bg-base-200 rounded-lg shadow-md p-5 md:p-7">
              <Projects />
            </div>
          )}
        </div>
        <div className="hidden 3xl:flex flex-col gap-3 gao flex-1/4 4xl:flex-1/6">
          <div className="bg-base-200 rounded-box shadow-md p-5 md:p-7 flex flex-col gap-5 h-fit">
            <h4>Oversigt over indhold</h4>
            <div className="text-sm text-gray-400 font-medium">
              {blogCount === null
                ? t("loading_blog")
                : t("sidebar_content_amount_blog", { count: blogCount })}
            </div>
            <div className="text-sm text-gray-400 font-medium">
              {projectsCount === null
                ? t("loading_projects")
                : t("sidebar_content_amount_projects", {
                    count: projectsCount,
                  })}
            </div>
          </div>
          <div className="bg-base-200 rounded-box shadow-md p-5 md:p-7 flex flex-col gap-5 h-fit">
            <h4>Opdateringer</h4>
            <div className="text-sm text-gray-400 font-medium">
              Ingen nye opdateringer
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavContent;
