import { NextResponse } from "next/server";

type Row = { x: string; y: number };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toLabel = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeXY = (value: unknown): Row[] => {
  const dataArray: unknown[] = Array.isArray(value)
    ? (value as unknown[])
    : isRecord(value) && Array.isArray(value.data)
    ? (value.data as unknown[])
    : [];

  return dataArray
    .map((entry): Row => {
      if (!isRecord(entry)) return { x: "", y: 0 };

      const labelSource =
        entry["x"] ?? entry["name"] ?? entry["path"] ?? entry["value"] ?? "";
      const countSource =
        entry["y"] ??
        entry["visitors"] ??
        entry["pageviews"] ??
        entry["count"] ??
        0;

      return {
        x: toLabel(labelSource),
        y: toNumber(countSource),
      };
    })
    .filter((row) => row.x.length > 0)
    .sort((a: Row, b: Row) => b.y - a.y);
};

const statVal = (source: unknown, key: string): number => {
  if (!isRecord(source)) return 0;

  const direct = source[key];
  if (typeof direct === "number") return direct;
  if (isRecord(direct) && typeof direct.value === "number") return direct.value;

  const data = source.data;
  if (!isRecord(data)) return 0;

  const nested = data[key];
  if (typeof nested === "number") return nested;
  if (isRecord(nested) && typeof nested.value === "number") return nested.value;

  return 0;
};

export async function GET(request: Request) {
  const BASE_URL = process.env.UMAMI_API_URL;
  const WEBSITE_ID = process.env.UMAMI_WEBSITE_ID;
  const ACCESS_TOKEN = process.env.UMAMI_ACCESS_TOKEN;

  if (!ACCESS_TOKEN || !BASE_URL || !WEBSITE_ID) {
    return NextResponse.json({
      pageviews: 0,
      visitors: 0,
      visits: 0,
      pages: [],
      devices: [],
      monthlyVisitors: [],
    });
  }

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get("period") ?? "";
  const period =
    periodParam === "30d" || periodParam === "365d" ? periodParam : "7d";
  const mode = searchParams.get("mode") ?? "";
  const months = Math.min(
    Math.max(Number(searchParams.get("months") ?? 6), 1),
    12
  );

  const endAt = Date.now();
  const defaultStart =
    period === "365d"
      ? endAt - 365 * 24 * 60 * 60 * 1000
      : period === "30d"
      ? endAt - 30 * 24 * 60 * 60 * 1000
      : endAt - 7 * 24 * 60 * 60 * 1000;
  const monthlyStart = endAt - months * 30 * 24 * 60 * 60 * 1000;
  const startAt = mode === "monthly" ? monthlyStart : defaultStart;

  const headers: HeadersInit = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    Accept: "application/json",
  };

  const statsUrl = `${BASE_URL}/api/websites/${WEBSITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`;
  const pagesUrl = `${BASE_URL}/api/websites/${WEBSITE_ID}/metrics?startAt=${startAt}&endAt=${endAt}&type=path&limit=50`;
  const devicesUrl = `${BASE_URL}/api/websites/${WEBSITE_ID}/metrics?startAt=${startAt}&endAt=${endAt}&type=device&limit=50`;

  try {
    const [statsRes, pagesRes, devicesRes] = await Promise.all([
      fetch(statsUrl, { headers, cache: "no-store" }),
      fetch(pagesUrl, { headers, cache: "no-store" }),
      fetch(devicesUrl, { headers, cache: "no-store" }),
    ]);

    const statsText = await statsRes.text();
    const pagesText = await pagesRes.text();
    const devicesText = await devicesRes.text();

    const statsJson = statsText ? JSON.parse(statsText) : {};
    const pagesJson = pagesText ? JSON.parse(pagesText) : [];
    const devicesJson = devicesText ? JSON.parse(devicesText) : [];

    // Hvis Umami svarer med fejl, log det på serveren (ikke i UI)
    if (!statsRes.ok)
      console.error("Umami stats failed", statsRes.status, statsText);
    if (!pagesRes.ok)
      console.error("Umami pages failed", pagesRes.status, pagesText);
    if (!devicesRes.ok)
      console.error("Umami devices failed", devicesRes.status, devicesText);

    const monthlyVisitors =
      mode === "monthly"
        ? await (async () => {
            const now = new Date(endAt);
            const count = Math.max(1, Math.min(months, 5)); // Always get last 5 months

            // Fetch actual data for each of the last 5 months
            const monthPromises = [];
            for (let i = count - 1; i >= 0; i--) {
              const monthStart = new Date(now);
              monthStart.setMonth(monthStart.getMonth() - i);
              monthStart.setDate(1);
              monthStart.setHours(0, 0, 0, 0);

              const monthEnd = new Date(monthStart);
              monthEnd.setMonth(monthEnd.getMonth() + 1);
              monthEnd.setDate(0);
              monthEnd.setHours(23, 59, 59, 999);

              const label = new Intl.DateTimeFormat("da-DK", {
                month: "short",
                year: "2-digit",
              }).format(monthStart);

              monthPromises.push(
                fetch(
                  `${BASE_URL}/api/websites/${WEBSITE_ID}/stats?startAt=${monthStart.getTime()}&endAt=${monthEnd.getTime()}`,
                  { headers, cache: "no-store" }
                )
                  .then((res) => res.text())
                  .then((text) => {
                    try {
                      const json = text ? JSON.parse(text) : {};
                      const visitors = statVal(json, "visitors");
                      return { x: label, y: visitors };
                    } catch {
                      return { x: label, y: 0 };
                    }
                  })
                  .catch(() => ({ x: label, y: 0 }))
              );
            }

            const results = await Promise.all(monthPromises);
            return results;
          })()
        : [];

    return NextResponse.json({
      pageviews: statVal(statsJson, "pageviews"),
      visitors: statVal(statsJson, "visitors"),
      visits: statVal(statsJson, "visits"),
      pages: normalizeXY(pagesJson), // [{x: "/kontakt", y: 12}, ...]
      devices: normalizeXY(devicesJson),
      monthlyVisitors,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Umami route crashed", message);
    return NextResponse.json({
      pageviews: 0,
      visitors: 0,
      visits: 0,
      pages: [],
      devices: [],
      monthlyVisitors: [],
    });
  }
}
