"use client";

import type { ApexOptions } from "apexcharts";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type MonthlyVisitorPoint = {
  x: string;
  y: number;
};

type ThemePalette = {
  primary: string;
  primaryAlt: string;
  content: string;
  grid: string;
  base: string;
  isDark: boolean;
};

const FALLBACK_THEME: ThemePalette = {
  primary: "#048179",
  primaryAlt: "#0AA197",
  content: "#171717",
  grid: "#d4d4d8",
  base: "#111111",
  isDark: false,
};

const normalizeColorValue = (value: string, fallback: string) => {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith("oklch")) return fallback;
  return trimmed;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const readThemePalette = (): ThemePalette => {
  if (typeof window === "undefined") return FALLBACK_THEME;

  const styles = getComputedStyle(document.documentElement);
  const themeAttr = document.documentElement.getAttribute("data-theme") ?? "";

  const primary = normalizeColorValue(
    styles.getPropertyValue("--color-primary"),
    FALLBACK_THEME.primary
  );
  const secondary = normalizeColorValue(
    styles.getPropertyValue("--color-secondary"),
    FALLBACK_THEME.primaryAlt
  );
  const content = normalizeColorValue(
    styles.getPropertyValue("--color-base-content"),
    FALLBACK_THEME.content
  );
  const grid = normalizeColorValue(
    styles.getPropertyValue("--color-base-300"),
    FALLBACK_THEME.grid
  );
  const base = normalizeColorValue(
    styles.getPropertyValue("--color-base-100"),
    FALLBACK_THEME.base
  );

  return {
    primary,
    primaryAlt: secondary,
    content,
    grid,
    base,
    isDark: themeAttr.toLowerCase().includes("dark"),
  };
};

type ApexChartsInstance = {
  render: () => void;
  updateOptions: (
    options: ApexOptions,
    redraw?: boolean,
    animate?: boolean
  ) => void;
  updateSeries: (series: unknown[], animate?: boolean) => void;
  destroy: () => void;
};

type ApexChartsConstructor = new (
  element: HTMLElement,
  options: ApexOptions
) => ApexChartsInstance;

const Chart = () => {
  const { t } = useTranslation();
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<ApexChartsInstance | null>(null);
  const apexchartsModuleRef = useRef<ApexChartsConstructor | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [series, setSeries] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [themeColors, setThemeColors] = useState<ThemePalette>(FALLBACK_THEME);

  const formatNumber = useCallback((value: number) => {
    const rounded = Math.round(value);
    try {
      return new Intl.NumberFormat("da-DK").format(rounded);
    } catch (localeError) {
      console.warn("Unable to format number", localeError);
      return rounded.toLocaleString();
    }
  }, []);

  useEffect(() => {
    const fetchMonthlyVisitors = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          "/api/umami?mode=monthly&months=5&period=365d"
        );

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const payload = (await response.json()) as {
          monthlyVisitors?: MonthlyVisitorPoint[];
        };

        const monthly = Array.isArray(payload?.monthlyVisitors)
          ? payload.monthlyVisitors
          : [];

        const recentMonthly = monthly.length > 5 ? monthly.slice(-5) : monthly;

        setCategories(recentMonthly.map((point) => point.x));
        setSeries(recentMonthly.map((point) => point.y));
      } catch (err) {
        console.error("Failed to load monthly analytics", err);
        setError("Unable to load analytics right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyVisitors();
  }, []);

  const chartHeading = t("analytics.visitors_by_month", {
    defaultValue: "Visitors per month",
  });
  const seriesName = t("analytics.visitors", { defaultValue: "Visitors" });
  const noDataLabel = t("analytics.no_data", { defaultValue: "No data yet" });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateTheme = () => {
      setThemeColors(readThemePalette());
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", updateTheme);
    } else if (typeof media.addListener === "function") {
      media.addListener(updateTheme);
    }

    return () => {
      observer.disconnect();
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", updateTheme);
      } else if (typeof media.removeListener === "function") {
        media.removeListener(updateTheme);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    const renderChart = async () => {
      if (!chartContainerRef.current) return;

      if (!apexchartsModuleRef.current) {
        const mod = await import("apexcharts");
        if (!active) return;
        const ApexChartsDefault = (mod as { default?: ApexChartsConstructor })
          .default;
        const ApexChartsModule = mod as unknown as ApexChartsConstructor;
        apexchartsModuleRef.current = ApexChartsDefault ?? ApexChartsModule;
      }

      const ApexChartsLib = apexchartsModuleRef.current;
      if (!ApexChartsLib) return;

      const labelColors = categories.map(() => themeColors.content);
      const tooltipBorder = themeColors.isDark
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.1)";
      const markerBackground = themeColors.primaryAlt;

      const options: ApexOptions = {
        colors: [themeColors.primary],
        series: [
          {
            name: seriesName,
            data: series,
          },
        ],
        chart: {
          height: 350,
          type: "bar",
          background: "transparent",
          toolbar: {
            show: false,
          },
          foreColor: themeColors.content,
          fontFamily: "inherit",
        },
        plotOptions: {
          bar: {
            borderRadius: 10,
            dataLabels: {
              position: "top",
            },
            columnWidth: "45%",
          },
        },
        dataLabels: {
          enabled: true,
          formatter: (val: number) => formatNumber(val),
          offsetY: -20,
          style: {
            fontSize: "12px",
            fontWeight: 600,
            colors: [themeColors.content],
          },
        },
        stroke: {
          show: true,
          width: 1,
          colors: [themeColors.primaryAlt],
        },
        fill: {
          type: "gradient",
          gradient: {
            shade: "light",
            type: "vertical",
            gradientToColors: [themeColors.primaryAlt],
            inverseColors: false,
            opacityFrom: 0.9,
            opacityTo: 0.95,
            stops: [0, 90, 100],
          },
        },
        xaxis: {
          categories,
          position: "top",
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
          crosshairs: {
            fill: {
              type: "gradient",
              gradient: {
                colorFrom: themeColors.primaryAlt,
                colorTo: themeColors.primary,
                stops: [0, 100],
                opacityFrom: 0.25,
                opacityTo: 0.35,
              },
            },
          },
          labels: {
            style: {
              colors: labelColors,
              fontWeight: 500,
            },
          },
          tooltip: {
            enabled: false,
          },
        },
        yaxis: {
          min: 0,
          max: (max: number) => {
            const headroom = max * 1.15;

            const step =
              headroom <= 50
                ? 10
                : headroom <= 100
                ? 20
                : headroom <= 250
                ? 50
                : headroom <= 500
                ? 100
                : 100;

            return Math.ceil(headroom / step) * step;
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
          labels: {
            formatter: (val: number) => formatNumber(val),
            offsetX: -6,
            style: {
              colors: [themeColors.content],
            },
          },
        },
        tooltip: {
          custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            const label =
              categories[dataPointIndex] ??
              (w?.globals?.categoryLabels?.[dataPointIndex] as
                | string
                | undefined) ??
              "";
            const rawValue = series?.[seriesIndex]?.[dataPointIndex];
            const value =
              typeof rawValue === "number" ? rawValue : Number(rawValue ?? 0);
            const formattedValue = formatNumber(
              Number.isFinite(value) ? value : 0
            );
            const safeLabel = escapeHtml(String(label));
            const safeSeriesName = escapeHtml(seriesName);

            return `
            <div style="background:${escapeHtml(
              themeColors.base
            )};padding:12px 16px;border-radius:12px;border:1px solid ${tooltipBorder};box-shadow:0 4px 12px rgba(0,0,0,0.28);color:${escapeHtml(
              themeColors.content
            )};font-family:inherit;min-width:140px;">
              <div style="font-size:12px;font-weight:600;opacity:0.85;">${safeLabel}</div>
              <div style="display:flex;align-items:center;gap:8px;margin-top:8px;font-size:13px;font-weight:600;">
                <span style="display:inline-flex;width:10px;height:10px;border-radius:9999px;background:${markerBackground};box-shadow:0 0 0 2px rgba(0,0,0,0.25);"></span>
                <span>${safeSeriesName}: ${formattedValue}</span>
              </div>
            </div>
          `;
          },
        },
        legend: {
          show: false,
        },
        grid: {
          borderColor: themeColors.grid,
          strokeDashArray: 6,
          padding: {
            left: 12,
            right: 12,
          },
          xaxis: {
            lines: {
              show: false,
            },
          },
          yaxis: {
            lines: {
              show: true,
            },
          },
        },
        states: {
          hover: {
            filter: {
              type: "lighten",
            },
          },
          active: {
            filter: {
              type: "darken",
            },
          },
        },
        responsive: [
          {
            breakpoint: 768,
            options: {
              plotOptions: {
                bar: {
                  columnWidth: "30%",
                },
              },
              dataLabels: {
                offsetY: -12,
                style: {
                  fontSize: "11px",
                },
              },
              title: {
                offsetY: 280,
              },
            },
          },
        ],
      };

      if (!chartInstanceRef.current) {
        chartInstanceRef.current = new ApexChartsLib(
          chartContainerRef.current,
          options
        );
        chartInstanceRef.current.render();
        return;
      }

      chartInstanceRef.current.updateOptions(options, true, true);
      chartInstanceRef.current.updateSeries(options.series ?? [], true);
    };

    renderChart();

    return () => {
      active = false;
    };
  }, [categories, series, seriesName, themeColors, formatNumber]);

  useEffect(() => {
    return () => {
      chartInstanceRef.current?.destroy();
      chartInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="2xl:flex-2 flex-1 bg-base-200 rounded-lg shadow-md p-3 md:p-7">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-base-content">
          {chartHeading}
        </h3>
      </div>
      {loading ? (
        <div className="min-h-[350px] flex flex-col gap-4">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-[300px] w-full" />
        </div>
      ) : error ? (
        <div className="flex h-64 items-center">
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : series.length === 0 ? (
        <div className="flex h-64 items-center">
          <p className="text-sm text-neutral-400">{noDataLabel}</p>
        </div>
      ) : (
        <div className="min-h-[350px]" ref={chartContainerRef} />
      )}
    </div>
  );
};

export default Chart;
