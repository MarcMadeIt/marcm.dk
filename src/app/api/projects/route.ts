// src/app/api/projects/route.ts
import { NextResponse } from "next/server";
import { getAllProjects } from "@/lib/server/actions";

interface ProjectRow {
  id: string;
  title: string;
  desc: string;
  desc_translated: string | null;
  source_lang: string;
  image: string | null;
  creator_id: string;
  created_at: string;
  website: string | null;
  github: string | null;
}

interface ProjectResponse {
  id: string;
  title: string;
  image: string | null;
  creator_id: string;
  created_at: string;
  desc: string;
  website: string | null;
  github: string | null;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "6", 10);
    const uiLang = url.searchParams.get("lang") === "en" ? "en" : "da";

    const { projects, total } = await getAllProjects(page, limit);
    const raw = projects as ProjectRow[];

    const transformed: ProjectResponse[] = raw.map((p) => {
      const desc =
        p.source_lang === uiLang ? p.desc : (p.desc_translated ?? p.desc);

      return {
        id: p.id,
        title: p.title,
        image: p.image,
        creator_id: p.creator_id,
        created_at: p.created_at,
        desc,
        website: p.website,
        github: p.github,
      };
    });

    return NextResponse.json({ projects: transformed, total }, { status: 200 });
  } catch (err: unknown) {
    console.error("API GET /api/projects error:", err);
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
