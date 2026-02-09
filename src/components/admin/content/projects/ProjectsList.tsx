"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { FaPen, FaTrash } from "react-icons/fa6";
import UpdateProject from "./updateProject/UpdateProject";
import { useTranslation } from "react-i18next";
import { deleteProject } from "@/lib/server/actions";

interface ProjectsListProps {
  view: "cards" | "list";
  page: number;
  setTotal: (total: number) => void;
  onEditProject: (projectId: string) => void;
}

interface ProjectItem {
  id: string;
  title: string;
  desc: string;
  image: string | null;
}

const FALLBACK_IMAGE = "/demo.jpg";

const ProjectsList = ({
  view,
  page,
  setTotal,
  onEditProject,
}: ProjectsListProps) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [projectItems, setProjectItems] = useState<ProjectItem[]>([]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/projects?page=${page}&limit=${itemsPerPage}&lang=${i18n.language}`,
      );
      if (!res.ok) throw new Error("Failed to load projects");
      const { projects, total } = await res.json();
      setProjectItems(projects);
      setTotal(total);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setProjectItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage, setTotal, i18n.language]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      if (width >= 1920) {
        setItemsPerPage(8);
      } else if (width >= 1024) {
        setItemsPerPage(6);
      } else {
        setItemsPerPage(4);
      }
    };

    updateItemsPerPage();

    window.addEventListener("resize", updateItemsPerPage);

    return () => {
      window.removeEventListener("resize", updateItemsPerPage);
    };
  }, []);

  const truncate = (text: string | null | undefined, max: number) =>
    text && text.length > max ? text.slice(0, max) + "…" : text || "";

  const handleProjectUpdated = () => {
    setEditingProjectId(null);
    fetchProjects();
  };

  const handleDelete = async () => {
    if (deletingProjectId == null) return;
    try {
      await deleteProject(deletingProjectId);
      setDeletingProjectId(null);
      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const closeModal = () => {
    setDeletingProjectId(null);
    setIsModalOpen(false);
  };

  if (editingProjectId) {
    return (
      <UpdateProject
        projectId={editingProjectId}
        onProjectUpdated={handleProjectUpdated}
      />
    );
  }

  return (
    <div className="w-full mt-3">
      {loading ? (
        view === "cards" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 4xl:grid-cols-4 gap-5">
            {[...Array(itemsPerPage)].map((_, index) => (
              <div
                key={index}
                className="card card-compact shadow-lg rounded-md"
              >
                <figure className="relative w-full aspect-4/3 h-56 overflow-hidden rounded-t-md">
                  <div className="skeleton w-full h-full"></div>
                </figure>
                <div className="card-body">
                  <div className="skeleton h-7 w-3/4"></div>
                  <div className="skeleton h-3 w-full mt-1"></div>
                  <div className="card-actions justify-end mt-2">
                    <div className="skeleton h-8 w-20"></div>
                    <div className="skeleton h-8 w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {[...Array(itemsPerPage)].map((_, index) => (
              <React.Fragment key={index}>
                <li>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                      <div className="skeleton w-12 h-10 rounded-md"></div>
                      <div className="skeleton h-4 w-32"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="skeleton h-8 w-20"></div>
                      <div className="skeleton h-8 w-16"></div>
                    </div>
                  </div>
                </li>
                <hr className="border-px rounded-lg border-base-200" />
              </React.Fragment>
            ))}
          </ul>
        )
      ) : projectItems.length === 0 ? (
        <div className="flex justify-center items-center h-40 w-full">
          <p className="text-gray-500">{t("no_projects")}</p>
        </div>
      ) : (
        <>
          {view === "cards" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 4xl:grid-cols-4 gap-5">
              {projectItems.map((item, itemIndex) => (
                <div
                  key={item.id}
                  className="card card-compact shadow-lg rounded-md"
                >
                  <figure className="relative w-full aspect-4/3 h-56 overflow-hidden">
                    <Image
                      src={item.image || FALLBACK_IMAGE}
                      alt={`Project study for ${item.title}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={itemIndex < 8}
                      loading="eager"
                      className="object-cover"
                    />
                  </figure>
                  <div className="card-body">
                    <h2 className="card-title text-lg">{item.title}</h2>
                    <p className="text-xs">{truncate(item.desc, 100)}</p>
                    <div className="card-actions justify-end mt-2">
                      <button
                        className="btn btn-sm"
                        onClick={() => onEditProject(item.id)}
                      >
                        <FaPen /> {t("edit")}
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => {
                          setDeletingProjectId(item.id);
                          setIsModalOpen(true);
                        }}
                      >
                        <FaTrash /> {t("delete")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {projectItems.map((item, itemIndex) => (
                <React.Fragment key={item.id}>
                  <li>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2 items-center">
                        <div className="relative w-12 h-10 rounded-md overflow-hidden">
                          <Image
                            src={item.image || FALLBACK_IMAGE}
                            alt={`Project study for ${item.title}`}
                            fill
                            style={{ objectFit: "cover" }}
                            priority={itemIndex < 8}
                            loading="eager"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-xs hidden sm:block">
                            {item.title}
                          </h3>
                          <h3 className="font-semibold text-xs block sm:hidden">
                            {truncate(item.title, 20)}
                          </h3>
                        </div>
                      </div>
                      <div className="flex gap-5 md:gap-2">
                        <button
                          className="btn btn-sm"
                          onClick={() => onEditProject(item.id)}
                        >
                          <FaPen />{" "}
                          <span className="md:flex hidden">{t("edit")}</span>
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={() => {
                            setDeletingProjectId(item.id);
                            setIsModalOpen(true);
                          }}
                        >
                          <FaTrash />{" "}
                          <span className="md:flex hidden">{t("delete")}</span>
                        </button>
                      </div>
                    </div>
                  </li>
                  <hr className="border-px rounded-lg border-base-200" />
                </React.Fragment>
              ))}
            </ul>
          )}
        </>
      )}

      {isModalOpen && deletingProjectId != null && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {t("delete_project_confirmation")}
            </h3>
            <p className="py-4">{t("delete_project_prompt")}</p>
            <p className="text-sm text-warning">
              {t("delete_project_warning")}
            </p>
            <div className="modal-action">
              <button className="btn" onClick={closeModal}>
                {t("cancel")}
              </button>
              <button className="btn btn-error" onClick={handleDelete}>
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
