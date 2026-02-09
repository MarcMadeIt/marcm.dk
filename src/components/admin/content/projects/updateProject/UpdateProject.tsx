import React, { useState, useEffect, useMemo } from "react";
import { updateProject, getProjectById } from "@/lib/server/actions";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { createClient } from "@/utils/supabase/client";

type TagRow = {
  id: string;
  name: string;
  category: string;
};

const UpdateProject = ({
  projectId,
  onProjectUpdated,
}: {
  projectId: string;
  onProjectUpdated: () => void;
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [website, setWebsite] = useState("");
  const [github, setGithub] = useState("");

  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagLoading, setTagLoading] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  const [errors, setErrors] = useState({
    title: "",
    desc: "",
    image: "",
    website: "",
    github: "",
  });
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projectData = await getProjectById(projectId);
        if (!projectData) {
          console.error(t("project_not_found"));
          return;
        }
        setTitle(projectData.title || "");
        setDesc(projectData.desc || "");
        setExistingImage(projectData.image || null);
        setWebsite(projectData.website || "");
        setGithub(projectData.github || "");
        setSelectedTagIds(projectData.tag_ids || []);
      } catch (error) {
        console.error(t("failed_to_fetch_project"), error);
      }
    };

    fetchProject();
  }, [projectId]);

  useEffect(() => {
    const fetchTags = async () => {
      setTagLoading(true);
      setTagError(null);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tags")
        .select("id,name,category")
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      if (error) {
        setTagError(error.message);
        setTags([]);
      } else {
        setTags((data as TagRow[]) ?? []);
      }
      setTagLoading(false);
    };

    fetchTags();
  }, []);

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!title || !desc) {
      setErrors({
        title: !title ? t("company_name_required") : "",
        desc: !desc ? t("desc_required") : "",
        image: "",
        website: "",
        github: "",
      });
      setLoading(false);
      return;
    }

    try {
      await updateProject(
        projectId,
        title,
        desc,
        image,
        website,
        github || undefined,
        selectedTagIds,
      );

      onProjectUpdated();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          general: error.message,
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 500) {
      setDesc(e.target.value);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full p-1 md:p-3">
      <span className="text-lg font-bold">{t("project_editing")}</span>

      <form
        onSubmit={handleUpdateProject}
        className="flex flex-col items-start gap-5 w-full"
      >
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-14 w-full">
          <div className="flex flex-col gap-5 items-center">
            <fieldset className="flex flex-col gap-2 relative w-full fieldset">
              <legend className="fieldset-legend">{t("title")}</legend>
              <input
                name="title"
                type="text"
                className="input input-bordered input-md"
                placeholder={t("title")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              {errors.title && (
                <span className="absolute -bottom-4 text-xs text-red-500">
                  {errors.title}
                </span>
              )}
            </fieldset>
            <fieldset className="flex flex-col gap-2 relative w-full fieldset">
              <legend className="fieldset-legend">{t("description")}</legend>
              <textarea
                name="desc"
                className="textarea textarea-bordered textarea-md"
                value={desc}
                onChange={handleDescChange}
                required
                placeholder={t("write_project_description")}
                style={{ resize: "none" }}
                cols={30}
                rows={8}
              ></textarea>
              <div className="text-right text-xs font-medium text-gray-500">
                {desc.length} / 500
              </div>
              {errors.desc && (
                <span className="absolute -bottom-4 text-xs text-red-500">
                  {errors.desc}
                </span>
              )}
            </fieldset>
          </div>
          <div className="flex flex-col gap-3 relative">
            <fieldset className="flex flex-col gap-2 relative w-full fieldset">
              <legend className="fieldset-legend">{t("website_url")}</legend>
              <input
                name="website"
                type="url"
                className="input input-bordered input-md"
                placeholder={t("write_website_url")}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
              {errors.website && (
                <span className="absolute -bottom-4 text-xs text-red-500">
                  {errors.website}
                </span>
              )}
            </fieldset>
            <fieldset className="flex flex-col gap-2 relative w-full fieldset">
              <legend className="fieldset-legend">GitHub URL</legend>
              <input
                name="github"
                type="url"
                className="input input-bordered input-md"
                placeholder="https://github.com/..."
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
            </fieldset>
            <fieldset className="flex flex-col gap-2 relative w-full fieldset">
              <legend className="fieldset-legend">{t("image_update")}</legend>
              <input
                name="image"
                type="file"
                accept="image/*"
                className="file-input file-input-bordered file-input-md w-full"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                aria-label={t("choose_image")}
              />
              {errors.image && (
                <span className="absolute -bottom-4 text-xs text-red-500">
                  {errors.image}
                </span>
              )}
              {existingImage && !image && (
                <div className="relative w-full overflow-hidden rounded-md h-0 pb-[56.25%]">
                  <Image
                    src={existingImage}
                    alt={t("existing_image")}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}
            </fieldset>

            <fieldset className="flex flex-col gap-2 relative w-full fieldset">
              <legend className="fieldset-legend">Tags</legend>
              {tagLoading ? (
                <div className="skeleton h-10 w-full" />
              ) : tagError ? (
                <div className="text-xs text-red-500">{tagError}</div>
              ) : tags.length === 0 ? (
                <div className="text-xs text-base-content/70">
                  Ingen tags fundet.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-64 overflow-auto pr-2">
                  {tags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`badge badge-sm cursor-pointer transition-all ${
                          isSelected
                            ? "badge-primary"
                            : "badge-outline"
                        }`}
                        aria-label={
                          isSelected
                            ? `${t("remove_tag")}: ${tag.name}`
                            : `${t("add_tag")}: ${tag.name}`
                        }
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </fieldset>
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary mt-2"
          disabled={loading}
        >
          {loading ? t("editing") : t("save")}
        </button>
      </form>
      {showToast && (
        <div className="toast bottom-20 md:bottom-0 toast-end">
          <div className="alert alert-success text-neutral-content">
            <span className="text-base md:text-lg">{t("project_updated")}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateProject;
