"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";

type TagRow = {
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

const NavSettings = () => {
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

  const canSubmit = useMemo(
    () => name.trim().length > 0 && slug.trim().length > 0,
    [name, slug],
  );

  const fetchTags = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tags")
      .select("id,name,slug,category,created_at")
      .order("name", { ascending: true });
    if (error) {
      setError(error.message);
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

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="bg-base-200 rounded-box p-5 md:p-7 shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg">Tags</h3>
            <p className="text-sm text-base-content/70">
              Overblik over alle tags i systemet.
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
                  </tr>
                </thead>
                <tbody>
                  {tags.map((tag) => (
                    <tr key={tag.id}>
                      <td className="font-medium">{tag.name}</td>
                      <td className="text-base-content/70">{tag.slug}</td>
                      <td className="text-base-content/70">{tag.category}</td>
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

export default NavSettings;
