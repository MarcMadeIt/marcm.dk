"use client";

import React, { useState } from "react";
import { FaAngleLeft } from "react-icons/fa6";
import ProjectsPagination from "./ProjectsPagination";
import CreateProject from "./createProject/CreateProject";
import UpdateProject from "./updateProject/UpdateProject";
import ProjectsListChange from "./ProjectsListChange";
import ProjectsList from "./ProjectsList";
import { useTranslation } from "react-i18next";

const Projects = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<"cards" | "list">("cards");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showUpdateProject, setShowUpdateProject] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [showToast, setShowToast] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const handleViewChange = (view: "cards" | "list") => {
    setView(view);
  };

  const handleProjectCreated = () => {
    setShowCreateProject(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleProjectUpdated = () => {
    setShowUpdateProject(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="flex flex-col md:items-start gap-7">
      {showCreateProject ? (
        <div className="flex flex-col items-start gap-5">
          <button
            onClick={() => setShowCreateProject(false)}
            className="btn"
            aria-label={t("aria.projects.back")}
          >
            <FaAngleLeft />
            {t("back")}
          </button>
          <CreateProject onProjectCreated={handleProjectCreated} />
        </div>
      ) : showUpdateProject && selectedProjectId !== null ? (
        <div className="flex flex-col items-start gap-5">
          <button
            onClick={() => setShowUpdateProject(false)}
            className="btn"
            aria-label={t("aria.projects.back")}
          >
            <FaAngleLeft />
            {t("back")}
          </button>
          <UpdateProject
            projectId={selectedProjectId}
            onProjectUpdated={handleProjectUpdated}
          />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center w-full">
            <button
              onClick={() => setShowCreateProject(true)}
              className="btn btn-primary btn-sm md:btn-md"
              aria-label={t("aria.projects.createProject")}
            >
              {t("create")} Project
            </button>
            <ProjectsListChange onViewChange={handleViewChange} />
          </div>
          <ProjectsList
            view={view}
            page={page}
            setTotal={setTotal}
            onEditProject={(projectId: string) => {
              setSelectedProjectId(projectId);
              setShowUpdateProject(true);
            }}
          />
          <div className="flex w-full justify-center">
            {total > 6 && (
              <ProjectsPagination page={page} setPage={setPage} total={total} />
            )}
          </div>
        </>
      )}
      {showToast && (
        <div className="toast bottom-20 md:bottom-0 toast-end">
          <div
            className="alert alert-success text-neutral-content"
            aria-label={
              showCreateProject
                ? t("aria.projects.projectCreated")
                : t("aria.projects.projectUpdated")
            }
          >
            <span className="text-base md:text-lg">
              {showCreateProject ? t("project_created") : t("project_updated")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
