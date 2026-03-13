"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FaArrowRight, FaGithub } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import { getProjectsForHomePage } from "@/lib/server/actions";

interface ProjectTag {
  id: string;
  name: string;
}

interface Project {
  id: string | number;
  title: string | null;
  desc: string | null;
  desc_translated: string | null;
  source_lang: string | null;
  image: string | null;
  website?: string;
  github?: string;
  created_at?: string;
  tags: ProjectTag[];
}

const FALLBACK_IMAGE = "/demo.jpg";

const Projects: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    getProjectsForHomePage()
      .then(({ projects: data }) => setProjects(data))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 800);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const uiLang = i18n.language?.startsWith("da") ? "da" : "en";
  const oldPortfolioText =
    uiLang === "da"
      ? "Se mine tidligere multimediedesigner-projekter fra 2023-2024."
      : "See my previous multimedia design projects from 2023-2024.";
  const oldPortfolioButton =
    uiLang === "da" ? "Se gammel portfolio" : "View old portfolio";

  const getDisplayDesc = (p: Project): string => {
    const sourceLang = (p.source_lang ?? "en").toLowerCase();
    const useOriginal = sourceLang === uiLang;
    if (useOriginal && p.desc) return p.desc;
    if (p.desc_translated) return p.desc_translated;
    return p.desc ?? "";
  };

  const renderTags = (tags: ProjectTag[], projectId: string | number) => {
    const list = isMobile ? tags.slice(0, 2) : tags;
    return list.map((tag) => (
      <span key={`${projectId}-${tag.id}`} className="badge badge-secondary">
        #{tag.name}
      </span>
    ));
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24 px-4 bg-base-100">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-[380px] md:h-[400px] rounded-2xl skeleton bg-base-200"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 md:py-24 px-4 bg-base-100">
        <div className="mx-auto max-w-7xl text-center text-error">{error}</div>
      </section>
    );
  }

  if (projects.length === 0) {
    return (
      <section className="py-16 md:py-24 px-4 bg-base-100">
        <div className="mx-auto max-w-7xl text-center text-base-content/70">
          {t("no_projects")}
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 px-4 bg-base-100">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {projects.map((project) => {
            const title = project.title ?? "Project";
            const imageUrl = project.image || FALLBACK_IMAGE;
            const description = getDisplayDesc(project);
            const tags = project.tags ?? [];
            const hasWebsite = !!project.website?.trim();
            const hasGithub = !!project.github?.trim();

            return (
              <div
                key={project.id}
                className="relative h-[380px] md:h-[380px] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="absolute inset-0 z-0">
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-cover rounded-2xl"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>

                <div
                  className="absolute inset-0 z-10"
                  style={{
                    background: `linear-gradient(0deg, 
                      rgba(10, 14, 10, 0.95) 30%, 
                      rgba(12, 20, 12, 0.80) 70%, 
                      rgba(0, 0, 0, 0) 100%
                    )`,
                  }}
                />

                <div className="relative z-10 h-full flex flex-col justify-end p-4 text-base-content">
                  <h3 className="text-sm md:text-base font-semibold mb-2">
                    {title}
                  </h3>

                  <p className="text-xs md:text-sm text-base-content/80 mb-3 w-full md:w-[80%] leading-relaxed">
                    {description}
                  </p>

                  <div className="flex flex-col gap-8 mt-2">
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {renderTags(tags, project.id)}
                      </div>
                    )}

                    <div className="flex gap-2 md:gap-4 lg:gap-6">
                      {hasGithub && (
                        <button
                          type="button"
                          onClick={() => window.open(project.github!, "_blank")}
                          aria-label="GitHub"
                          className="flex items-center gap-2 font-semibold text-sm md:text-base hover:text-accent transition-colors duration-300 bg-transparent border-none cursor-pointer"
                        >
                          <FaGithub className="text-base md:text-lg" />
                          <span className="hidden md:inline">
                            {t("projects_get_source")}
                          </span>
                        </button>
                      )}

                      {hasWebsite && (
                        <button
                          type="button"
                          onClick={() =>
                            window.open(project.website!, "_blank")
                          }
                          aria-label={t("project_view")}
                          className="relative flex items-center gap-2 font-semibold text-sm md:text-base hover:text-accent transition-colors duration-300 bg-transparent border-none cursor-pointer overflow-hidden group/btn"
                        >
                          <span>{t("project_view")}</span>
                          <FaArrowRight className="text-sm md:text-base" />
                          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover/btn:w-full transition-all duration-500 rounded-full" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 md:mt-24 pt-4 md:pt-6 flex flex-col items-center gap-5 text-center">
          <p className="text-sm md:text-base text-base-content/75 max-w-2xl">
            {oldPortfolioText}
          </p>
          <a
            href="https://mm.marcm.dk/projects"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-primary"
          >
            {oldPortfolioButton}
          </a>
        </div>
      </div>
    </section>
  );
};

export default Projects;
