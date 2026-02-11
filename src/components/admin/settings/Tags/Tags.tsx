"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";

export type TagRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  created_at: string;
};

const CATEGORY_OPTIONS = [
  "framework",
  "language",
  "database",
  "orm",
  "cloud",
  "devops",
  "api",
  "platform",
  "tool",
] as const;

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const Tags = () => {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]>(
    "framework",
  );
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editCategory, setEditCategory] = useState<
    (typeof CATEGORY_OPTIONS)[number]
  >("framework");
  const [editSlugTouched, setEditSlugTouched] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const canSubmit = useMemo(
    () => name.trim().length > 0 && slug.trim().length > 0,
    [name, slug],
  );

  const canSaveEdit = useMemo(
    () =>
      editingId !== null &&
      editName.trim().length > 0 &&
      editSlug.trim().length > 0,
    [editingId, editName, editSlug],
  );

  const fetchTags = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("tags")
      .select("id,name,slug,category,created_at")
      .order("name", { ascending: true });
    if (fetchError) {
      setError(fetchError.message);
      setTags([]);
    } else {
      setTags((data as TagRow[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(toSlug(value));
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.from("tags").insert({
      name: name.trim(),
      slug: slug.trim(),
      category,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setName("");
    setSlug("");
    setSlugTouched(false);
    await fetchTags();
    setSaving(false);
  };

  const startEdit = (tag: TagRow) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditSlug(tag.slug);
    setEditCategory(tag.category as (typeof CATEGORY_OPTIONS)[number]);
    setEditSlugTouched(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditSlug("");
    setEditCategory("framework");
  };

  const handleEditNameChange = (value: string) => {
    setEditName(value);
    if (!editSlugTouched) {
      setEditSlug(toSlug(value));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !canSaveEdit) return;
    setSavingEdit(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("tags")
      .update({
        name: editName.trim(),
        slug: editSlug.trim(),
        category: editCategory,
      })
      .eq("id", editingId);

    if (error) {
      setError(error.message);
      setSavingEdit(false);
      return;
    }

    cancelEdit();
    await fetchTags();
    setSavingEdit(false);
  };

  const handleDelete = async (tag: TagRow) => {
    if (!confirm(`Slet tag "${tag.name}"? Dette kan ikke fortrydes.`)) return;
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.from("tags").delete().eq("id", tag.id);

    if (error) {
      setError(error.message);
      return;
    }

    await fetchTags();
    if (editingId === tag.id) cancelEdit();
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="bg-base-200 rounded-box p-5 md:p-7 shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg">Tags</h3>
            <p className="text-sm text-base-content/70">
              Overblik over alle tags i systemet. Rediger eller slet her.
            </p>
          </div>
          <button
            className="btn btn-sm"
            onClick={fetchTags}
            disabled={loading}
          >
            Opdater
          </button>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="space-y-3">
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-full" />
            </div>
          ) : tags.length === 0 ? (
            <p className="text-sm text-base-content/70">Ingen tags endnu.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Navn</th>
                    <th>Slug</th>
                    <th>Kategori</th>
                    <th className="w-28 text-right">Handlinger</th>
                  </tr>
                </thead>
                <tbody>
                  {tags.map((tag) => (
                    <tr key={tag.id}>
                      {editingId === tag.id ? (
                        <>
                          <td>
                            <input
                              type="text"
                              className="input input-bordered input-sm w-full max-w-xs"
                              value={editName}
                              onChange={(e) =>
                                handleEditNameChange(e.target.value)
                              }
                              placeholder="Navn"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="input input-bordered input-sm w-full max-w-xs"
                              value={editSlug}
                              onChange={(e) => {
                                setEditSlugTouched(true);
                                setEditSlug(e.target.value);
                              }}
                              placeholder="slug"
                            />
                          </td>
                          <td>
                            <select
                              className="select select-bordered select-sm w-full max-w-[140px]"
                              value={editCategory}
                              onChange={(e) =>
                                setEditCategory(
                                  e.target.value as (typeof CATEGORY_OPTIONS)[number],
                                )
                              }
                            >
                              {CATEGORY_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="text-right">
                            <div className="flex gap-1 justify-end">
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                onClick={cancelEdit}
                                disabled={savingEdit}
                              >
                                Annuller
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary btn-xs"
                                onClick={handleSaveEdit}
                                disabled={!canSaveEdit || savingEdit}
                              >
                                {savingEdit ? "..." : "Gem"}
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="font-medium">{tag.name}</td>
                          <td className="text-base-content/70">{tag.slug}</td>
                          <td className="text-base-content/70">
                            {tag.category}
                          </td>
                          <td className="text-right">
                            <div className="flex gap-1 justify-end">
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                onClick={() => startEdit(tag)}
                              >
                                Rediger
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs text-error"
                                onClick={() => handleDelete(tag)}
                              >
                                Slet
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-base-200 rounded-box p-5 md:p-7 shadow-md">
        <h3 className="font-semibold text-lg">Opret nyt tag</h3>
        <p className="text-sm text-base-content/70">
          Udfyld navn, slug og kategori.
        </p>

        <form className="mt-4 grid gap-4" onSubmit={handleCreate}>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Navn</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Fx React"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Slug</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="fx react"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Kategori</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value as (typeof CATEGORY_OPTIONS)[number],
                )
              }
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="alert alert-error text-sm">
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!canSubmit || saving}
            >
              {saving ? "Gemmer..." : "Opret tag"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Tags;
