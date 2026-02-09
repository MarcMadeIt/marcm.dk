"use client";

import type { ApexOptions } from "apexcharts";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type PageMetric = { x: string; y: number };

const solutions = [
  { key: "web-applications", nameKey: "web-applications" },
  { key: "design-ux", nameKey: "design-ux" },
  { key: "3d-visualization", nameKey: "visualization" },
  { key: "systems-integrations", nameKey: "systems-integration" },
];

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

const PieChart = () => {
  const { t } = useTranslation();
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<ApexChartsInstance | null>(null);
  const apexchartsModuleRef = useRef<ApexChartsConstructor | null>(null);

  const [labels, setLabels] = useState<string[]>([]);
  const [series, setSeries] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseColor, setBaseColor] = useState("#111827");
  const [contentColor, setContentColor] = useState("#E4E4E4");
  const [isDark, setIsDark] = useState(true);

  // Læs theme farver fra CSS og opdater ved theme-skift
  useEffect(() => {
    const updateThemeColors = () => {
      const styles = getComputedStyle(document.documentElement);
      const themeAttr = document.documentElement.getAttribute("data-theme") ?? "";
      
      const base = styles.getPropertyValue("--color-base-100").trim();
      const content = styles.getPropertyValue("--color-base-content").trim();
      
      if (base) setBaseColor(base);
      if (content) setContentColor(content);
      setIsDark(themeAttr.toLowerCase().includes("dark"));
    };

    updateThemeColors();

    // Observer for at fange theme-skift
    const observer = new MutationObserver(updateThemeColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/umami?period=365d");
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const payload = (await res.json()) as { pages?: PageMetric[] };
        const pages = Array.isArray(payload?.pages) ? payload.pages : [];

        const solutionAggregates = solutions.map((sol) => {
          const basePath = `/solutions/${sol.key}`;

          const total = pages
            .filter((p) => {
              const path = p.x || "";
              return path.startsWith(basePath);
            })
            .reduce((sum, p) => sum + (p.y || 0), 0);

          return {
            name: t(`SolutionsPage.${sol.nameKey}`),
            total,
          };
        });

        const filtered = solutionAggregates.filter((s) => s.total > 0);

        if (filtered.length === 0) {
          setLabels(solutions.map((s) => t(`SolutionsPage.${s.nameKey}`)));
          setSeries(solutions.map(() => 0));
        } else {
          setLabels(filtered.map((s) => s.name));
          setSeries(filtered.map((s) => s.total));
        }
      } catch (err) {
        console.error("Failed to load solution analytics", err);
        setError(
          t("analytics.error", { defaultValue: "Kan ikke hente data lige nu." })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  useEffect(() => {
    let active = true;

    const renderChart = async () => {
      if (!chartContainerRef.current) return;
      if (labels.length === 0) return;

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

      const options: ApexOptions = {
        series,
        chart: {
          type: "pie",
          width: "100%",
          height: "100%",
          background: "transparent",
        },

        // ✅ DETTE er den hvide “ring”/separator du ser
        stroke: {
          show: true,
          width: 3,
          colors: [baseColor],
        },

        labels,
        theme: {
          monochrome: {
            enabled: true,
            color: "#048179",
            shadeTo: "light",
            shadeIntensity: 0.7,
          },
        },
        plotOptions: {
          pie: {
            dataLabels: {
              offset: -18, // var -5 → længere ind i cirklen
              minAngleToShowLabel: 14, // skjul label på meget små slices
            },
          },
        },
        grid: {
          padding: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          },
        },
        dataLabels: {
          formatter(val: number, opts) {
            const name = opts.w.globals.labels[opts.seriesIndex] as string;
            const pct = Number.isFinite(val) ? val.toFixed(1) : "0.0";
            return [name, `${pct}%`];
          },
        },
        legend: {
          show: false,
        },
        tooltip: {
          custom: ({ series: s, seriesIndex, w }) => {
            const label = w?.globals?.labels?.[seriesIndex] ?? "";
            const value = s?.[seriesIndex] ?? 0;
            const total = s?.reduce((a: number, b: number) => a + b, 0) ?? 1;
            const pct = ((value / total) * 100).toFixed(1);
            const tooltipBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";

            return `
              <div style="background:${baseColor};padding:12px 16px;border-radius:12px;border:1px solid ${tooltipBorder};box-shadow:0 4px 12px rgba(0,0,0,0.28);color:${contentColor};font-family:inherit;min-width:140px;">
                <div style="font-size:12px;font-weight:600;opacity:0.85;">${label}</div>
                <div style="display:flex;align-items:center;gap:8px;margin-top:8px;font-size:13px;font-weight:600;">
                  <span style="display:inline-flex;width:10px;height:10px;border-radius:9999px;background:#048179;box-shadow:0 0 0 2px rgba(0,0,0,0.25);"></span>
                  <span>${value} besøg (${pct}%)</span>
                </div>
              </div>
            `;
          },
        },
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
  }, [labels, series, baseColor, contentColor, isDark]);

  useEffect(() => {
    return () => {
      chartInstanceRef.current?.destroy();
      chartInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="flex-1 bg-base-200 rounded-lg shadow-md p-3 md:p-7 hidden xl:block">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-base-content">
          {t("analytics.visitors_by_solution", {
            defaultValue: "Besøgende pr. løsning (seneste 1 år)",
          })}
        </h3>
      </div>
      {loading ? (
        <div className="min-h-[380px] flex flex-col gap-4">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton rounded-full h-[260px] w-[260px] mx-auto" />
        </div>
      ) : error ? (
        <div className="flex h-64 items-center">
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : (
        <div className="min-h-[380px] flex items-center justify-center pt-5">
          <div
            className="relative w-full max-w-[320px] aspect-square"
            ref={chartContainerRef}
          />
        </div>
      )}
    </div>
  );
};

export default PieChart;
