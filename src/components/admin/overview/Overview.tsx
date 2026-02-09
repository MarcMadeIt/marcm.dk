"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Chart from "./Chart";
import PieChart from "./PieChart";

const Overview = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<{
    pageviews: number;
    visitors: number;
    visits: number;
    pages: { x: string; y: number }[];
    devices: { x: string; y: number }[];
  }>({
    pageviews: 0,
    visitors: 0,
    visits: 0,
    pages: [],
    devices: [],
  });
  const [period, setPeriod] = useState("7d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/umami?period=${period}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
        setData({
          pageviews: 0,
          visitors: 0,
          visits: 0,
          pages: [],
          devices: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  // Group pages by solution type
  const areaPages = useMemo(() => {
    if (!data.pages || data.pages.length === 0) return [];

    const solutions = [
      { key: "web-applications", nameKey: "web-applications" },
      { key: "design-ux", nameKey: "design-ux" },
      { key: "3d-visualization", nameKey: "visualization" },
      { key: "systems-integrations", nameKey: "systems-integration" },
    ];

    const solutionMap: Record<string, { name: string; y: number }> = {};

    data.pages.forEach((page) => {
      const path = page.x || "";

      // Only process solutions paths
      if (!path.startsWith("/solutions/")) return;

      // Find which solution this path belongs to
      const solution = solutions.find((sol) =>
        path.startsWith(`/solutions/${sol.key}`)
      );

      if (solution) {
        const name = t(`SolutionsPage.${solution.nameKey}`);
        if (solutionMap[solution.key]) {
          solutionMap[solution.key].y += page.y;
        } else {
          solutionMap[solution.key] = { name, y: page.y };
        }
      }
    });

    return Object.values(solutionMap).sort((a, b) => b.y - a.y);
  }, [data.pages, t]);

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-base-200 rounded-lg shadow-md p-3 md:p-7">
        <div className="flex justify-end items-center mb-5">
          <div role="tablist" className="tabs tabs-border">
            <button
              role="tab"
              className={`tab ${period === "7d" ? "tab-active" : ""}`}
              onClick={() => setPeriod("7d")}
              aria-label={t("aria.overview.last7DaysTab")}
              type="button"
            >
              {t("analytics.last_7_days")}
            </button>
            <button
              role="tab"
              className={`tab ${period === "30d" ? "tab-active" : ""}`}
              onClick={() => setPeriod("30d")}
              aria-label={t("aria.overview.last30DaysTab")}
              type="button"
            >
              {t("analytics.last_30_days")}
            </button>
          </div>
        </div>
        <h3 className="text-lg font-semibold">
          {t("analytics.title")} (
          {period === "7d"
            ? t("analytics.last_7_days")
            : t("analytics.last_30_days")}
          )
        </h3>

        {loading ? (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <div className="skeleton h-4 w-20" />
                <div className="skeleton h-8 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <h4 className="text-sm">{t("analytics.visitors")}</h4>
              <p className="text-2xl sm:text-3xl font-bold">{data.visitors}</p>
            </div>
            <div>
              <h4 className="text-sm">{t("analytics.pageviews")}</h4>
              <p className="text-2xl sm:text-3xl font-bold">{data.pageviews}</p>
            </div>
            <div>
              <h4 className="text-sm">{t("analytics.visits")}</h4>
              <p className="text-2xl sm:text-3xl font-bold">{data.visits}</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-4 w-full items-stretch">
        <Chart />
        <PieChart />
      </div>
      <div className="bg-base-200 rounded-lg shadow-md p-3 md:p-7">
        <div className="flex justify-between items-center">
          <h3 className="text-base lg:text-lg font-semibold">
            {t("analytics.most_visited_areas", {
              defaultValue: "Mest besøgte side områder",
            })}
          </h3>
          <span className="text-xs lg:text-sm text-gray-600">
            (
            {period === "7d"
              ? t("analytics.last_7_days")
              : t("analytics.last_30_days")}
            )
          </span>
        </div>
        {loading ? (
          <div className="flex flex-col gap-3 mt-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="flex justify-between border-b border-zinc-800 py-[10px]"
              >
                <div className="skeleton h-5 w-32" />
                <div className="skeleton h-5 w-10" />
              </div>
            ))}
          </div>
        ) : areaPages && areaPages.length > 0 ? (
          <ul className="flex flex-col gap-3 mt-3">
            {areaPages.map((page, index) => (
              <li
                key={`${page.name}-${index}`}
                className="flex justify-between border-b border-zinc-800 py-2"
              >
                <span>{page.name}</span>
                <span className="font-bold">{page.y}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-neutral-400 mt-3">
            {t("analytics.no_data", { defaultValue: "Ingen data endnu" })}
          </p>
        )}
      </div>
      <div className="bg-base-200 rounded-lg shadow-md p-3 md:p-7">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {t("analytics.most_visited")}
          </h3>
          <span className="text-xs lg:text-sm text-gray-600">
            (
            {period === "7d"
              ? t("analytics.last_7_days")
              : t("analytics.last_30_days")}
            )
          </span>
        </div>
        {loading ? (
          <div className="flex flex-col gap-3 mt-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="flex justify-between border-b border-zinc-800 py-[10px]"
              >
                <div className="skeleton h-5 w-32" />
                <div className="skeleton h-5 w-10" />
              </div>
            ))}
          </div>
        ) : data.pages && data.pages.length > 0 ? (
          <ul className="flex flex-col gap-3 mt-3">
            {data.pages.slice(0, 5).map((page, index) => (
              <li
                key={`${page.x}-${index}`}
                className="flex justify-between border-b border-zinc-800 py-2"
              >
                <span>{page.x}</span>
                <span className="font-bold">{page.y}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-neutral-400 mt-3">Ingen data endnu</p>
        )}
      </div>

      <div className="bg-base-200 rounded-lg shadow-md p-3 md:p-7">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{t("analytics.devices")}</h3>
          <span className="text-xs lg:text-sm text-gray-600">
            (
            {period === "7d"
              ? t("analytics.last_7_days")
              : t("analytics.last_30_days")}
            )
          </span>
        </div>
        {loading ? (
          <div className="flex flex-col gap-3 mt-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="flex justify-between border-b border-zinc-800 py-2"
              >
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-4 w-10" />
              </div>
            ))}
          </div>
        ) : data.devices && data.devices.length > 0 ? (
          <ul className="flex flex-col gap-3 mt-3">
            {data.devices.map((device, index) => {
              const deviceMapping: Record<
                "mobile" | "desktop" | "laptop" | "tablet" | "unknown",
                string
              > = {
                mobile: t("analytics.mobile"),
                desktop: t("analytics.desktop"),
                laptop: t("analytics.laptop"),
                tablet: t("analytics.tablet"),
                unknown: t("analytics.unknown"),
              };
              const deviceName =
                deviceMapping[
                  device.x?.toLowerCase() as keyof typeof deviceMapping
                ] || device.x;

              return (
                <li
                  key={`${device.x}-${index}`}
                  className="flex justify-between border-b border-zinc-800 py-2"
                >
                  <span>{deviceName}</span>
                  <span className="font-bold">{device.y}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-neutral-400 mt-3">Ingen data endnu</p>
        )}
      </div>
    </div>
  );
};

export default Overview;
