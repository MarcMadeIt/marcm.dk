import React, { useState, useEffect, useMemo } from "react";
import { createProject } from "@/lib/server/actions";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { FaXmark } from "react-icons/fa6";
import { createClient } from "@/utils/supabase/client";

type TagRow = {
  id: string;
  name: string;
  category: string;
};

const CreateProject = ({
  onProjectCreated,
}: {
  onProjectCreated: () => void;
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [website, setWebsite] = useState("https://");
  const [github, setGithub] = useState("");
  const [tags, setTags] = useState<TagRow[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [errors, setErrors] = useState({
    title: "",
    desc: "",
    image: "",
    website: "",
    github: "",
  });
  const [loading, setLoading] = useState(false);
  const [tagLoading, setTagLoading] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  // Cleanup object URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

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

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);

    if (file) {
      // Cleanup previous URL
      if (imageUrl && imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
      }
      // Create new URL
      const newUrl = URL.createObjectURL(file);
      setImageUrl(newUrl);
    } else {
      setImageUrl("");
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
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
      await createProject({
        title,
        desc,
        image,
        website,
        github: github || undefined,
        tagIds: selectedTagIds,
      });

      // Reset form
      setTitle("");
      setDesc("");
      setImage(null);
      setImageUrl("");
      setWebsite("https://");
      setGithub("");
      setSelectedTagIds([]);
      onProjectCreated();
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
      <span className="text-lg font-bold">{t("project_creation")}</span>
      <form
        onSubmit={handleCreateProject}
        className="flex flex-col items-start gap-5 w-full"
      >
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-14 w-full">
          <div className="flex flex-col gap-3 items-center">
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
                aria-label={t("title")}
              />
              {errors.title && (
                <span className="absolute -bottom-4 text-xs text-error">
                  {errors.title}
                </span>
              )}
            </fieldset>

            <fieldset className="flex flex-col gap-2 relative w-full fieldset ">
              <legend className="fieldset-legend">{t("desc")}</legend>
              <textarea
                name="desc"
                className="textarea textarea-bordered textarea-md text"
                value={desc}
                onChange={handleDescChange}
                required
                placeholder={t("write_desc")}
                style={{ resize: "none" }}
                cols={30}
                rows={8}
                aria-label={t("aria.createProject.description")}
              ></textarea>
              <div className="text-right text-xs font-medium text-base-content/30 max-w-xs absolute right-5 bottom-3">
                {desc.length} / 500
              </div>
              {errors.desc && (
                <span className="absolute -bottom-4 text-xs text-error">
                  {errors.desc}
                </span>
              )}
            </fieldset>
            <fieldset className="flex flex-col gap-2 relative w-full fieldset">
              <legend className="fieldset-legend">{t("choose_image")}</legend>
              <input
                name="image"
                type="file"
                className="file-input file-input-bordered file-input-md w-full"
                onChange={handleImageChange}
                required
                accept="image/*"
                aria-label={t("aria.createProject.chooseImage")}
              />
              {errors.image && (
                <span className="absolute -bottom-4 text-xs text-error">
                  {errors.image}
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
                placeholder="https://"
                className="input input-bordered input-md"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                aria-label={t("aria.createProject.websiteUrl")}
              />
              {errors.website && (
                <span className="absolute -bottom-4 text-xs text-error">
                  {errors.website}
                </span>
              )}
            </fieldset>
            <fieldset className="flex flex-col gap-2 relative w-full fieldset">
              <legend className="fieldset-legend">GitHub URL</legend>
              <input
                name="github"
                type="url"
                placeholder="https://github.com/..."
                className="input input-bordered input-md"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
            </fieldset>

            <fieldset className="flex flex-col gap-2 relative w-full fieldset max-w-xs">
              <legend className="fieldset-legend">Tags</legend>
              {tagLoading ? (
                <div className="skeleton h-10 w-full" />
              ) : tagError ? (
                <div className="text-xs text-error">{tagError}</div>
              ) : tags.length === 0 ? (
                <div className="text-xs text-base-content/70">
                  Ingen tags fundet.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 overflow-auto">
                  {tags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`badge badge-md cursor-pointer transition-all ${
                          isSelected ? "badge-primary" : "badge-soft"
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

            {imageUrl && (
              <fieldset className="fieldset w-full flex flex-col gap-3">
                <legend className="fieldset-legend">
                  {t("image_preview")}
                </legend>
                <div className="relative group w-fit">
                  <Image
                    src={imageUrl}
                    alt="Selected image preview"
                    width={200}
                    height={150}
                    className="rounded-lg object-cover border border-base-300"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 btn btn-xs btn-circle btn-error opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setImage(null);
                      setImageUrl("");
                      // Reset file input
                      const fileInput = document.querySelector(
                        'input[name="image"]',
                      ) as HTMLInputElement;
                      if (fileInput) fileInput.value = "";
                    }}
                    title="Fjern billede"
                  >
                    <FaXmark />
                  </button>
                </div>
              </fieldset>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary mt-2"
          disabled={loading}
          aria-label={
            loading
              ? t("aria.createProject.creating")
              : t("aria.createProject.create")
          }
        >
          {loading ? t("creating") : t("create")}
        </button>
      </form>
    </div>
  );
};

export default CreateProject;
