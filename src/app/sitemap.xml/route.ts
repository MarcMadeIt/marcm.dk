import { createAdminClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

type JobRecord = { slug: string; created_at: string | null };

export async function GET() {
  const baseUrl = "https://arzonic.com";
  const today = new Date().toISOString().split("T")[0];

  let jobs: JobRecord[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseServiceKey) {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("slug, created_at")
      .eq("active", true);

    if (error) {
      console.error("Failed to fetch jobs for sitemap:", error.message);
    } else if (Array.isArray(data)) {
      jobs = data
        .filter((job): job is { slug: string; created_at: string | null } =>
          Boolean(job?.slug)
        )
        .map((job) => ({
          slug: job.slug,
          created_at: job.created_at ?? null,
        }));
    }
  } else {
    console.warn(
      "Skipping jobs section in sitemap: Supabase environment variables are missing."
    );
  }

  const staticPaths = [
    "",
    "solutions",
    "cases",
    "about",
    "jobs",
    "contact",
    "solutions/custom-websites",
    "solutions/web-applications",
    "solutions/3d-visualization",
    "solutions/design-animation",
  ];

  const dynamicCountries = [
    "denmark",
    "sweden",
    "norway",
    "finland",
    "germany",
    "netherlands",
    "belgium",
    "ireland",
    "switzerland",
    "estonia",
    "poland",
    "czechia",
    "latvia",
    "lithuania",
    "austria",
  ];

  const urls = [
    ...staticPaths.map(
      (path) => `
    <url>
      <loc>${baseUrl}/${path}</loc>
      <changefreq>weekly</changefreq>
      <priority>${path === "" ? "1.0" : "0.8"}</priority>
      <lastmod>${today}</lastmod>
    </url>`
    ),
    ...dynamicCountries.flatMap((country) =>
      [
        "solutions/custom-websites",
        "solutions/web-applications",
        "solutions/3d-visualization",
        "solutions/design-animation",
      ].map(
        (slug) => `
      <url>
        <loc>${baseUrl}/${slug}/${country}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
        <lastmod>${today}</lastmod>
      </url>`
      )
    ),
    ...jobs.map(
      (job) => `
      <url>
        <loc>${baseUrl}/jobs/${job.slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
        <lastmod>${job.created_at?.split("T")[0] || today}</lastmod>
      </url>`
    ),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new NextResponse(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
