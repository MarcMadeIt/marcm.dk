"use server";

import {
  createAdminClient,
  createServerClientInstance,
} from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import {
  postToFacebookPage,
  deleteFacebookPost,
  postToInstagram,
} from "./some";

// ─────────────────────────────────────────────────────────────────────────────
// DEEPL TRANSLATION HELPER (header-baseret auth - november 2025 krav)
// ─────────────────────────────────────────────────────────────────────────────

const DEEPL_ENDPOINT = "https://api-free.deepl.com/v2/translate";

async function translateWithDeepL(
  text: string,
  targetLang: string,
): Promise<{ text: string; detected_source_language: string }> {
  const apiKey = process.env.DEEPL_API_KEY!;
  const response = await fetch(DEEPL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      target_lang: targetLang,
    }),
  });
  if (!response.ok) {
    throw new Error(`DeepL error ${response.status}: ${await response.text()}`);
  }
  const result = (await response.json()) as {
    translations: { text: string; detected_source_language: string }[];
  };
  return result.translations[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────────

export async function login(formData: FormData) {
  const supabase = await createServerClientInstance();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    // Return a generic error message
    return { success: false, message: "Wrong credentials" };
  } else {
    return { success: true };
  }
}

export async function createMember(data: {
  email: string;
  password: string;
  role: "editor" | "admin" | "developer";
  name: string;
}) {
  const supabase = await createAdminClient();

  try {
    if (!supabase.auth.admin) {
      throw new Error("REGISTRATION_ERROR");
    }

    const createResult = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        role: data.role,
      },
    });

    if (createResult.error) {
      const msg = createResult.error.message.toLowerCase();

      if (msg.includes("already") && msg.includes("registered")) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }

      if (msg.includes("not allowed")) {
        throw new Error("REGISTRATION_ERROR");
      }

      throw new Error("REGISTRATION_ERROR");
    }

    const userId = createResult.data.user?.id;
    if (!userId) {
      throw new Error("REGISTRATION_ERROR");
    }

    const memberResult = await supabase
      .from("members")
      .insert({ name: data.name, id: userId, role: data.role });

    if (memberResult.error) {
      console.error(
        "Failed to insert into members:",
        memberResult.error.message,
      );
      throw new Error("REGISTRATION_ERROR");
    }

    return createResult.data.user;
  } catch (err) {
    console.error("Unexpected error during member creation:", err);
    throw err;
  }
}

export async function signOut() {
  const supabase = await createServerClientInstance();

  // Log kun ud på denne enhed (local scope)
  await supabase.auth.signOut({ scope: "local" });

  revalidatePath("/", "layout");
  redirect("/login");
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllUsers() {
  const supabase = await createAdminClient();

  const {
    data: { users },
    error: fetchError,
  } = await supabase.auth.admin.listUsers();

  if (fetchError) {
    throw new Error("Failed to fetch users: " + fetchError.message);
  }

  const userIds = users.map((user) => user.id);

  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("id, name, role")
    .in("id", userIds);

  if (membersError) {
    throw new Error("Failed to fetch members: " + membersError.message);
  }

  const usersWithRolesAndNames = users.map((user) => {
    const member = members.find((m) => m.id === user.id);
    return {
      ...user,
      role: member?.role ?? null,
      name: member?.name ?? null,
    };
  });

  return usersWithRolesAndNames || [];
}

export async function deleteUser(userId: string) {
  const supabase = await createAdminClient();

  try {
    const { error: deleteAuthError } =
      await supabase.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error(
        "Failed to delete user from auth:",
        deleteAuthError.message,
      );
      throw new Error(
        "Failed to delete user from auth: " + deleteAuthError.message,
      );
    }

    console.log("User deleted from auth:", userId);

    const { error: deleteMemberError } = await supabase
      .from("members")
      .delete()
      .eq("id", userId);

    if (deleteMemberError) {
      console.error(
        "Failed to delete user from members:",
        deleteMemberError.message,
      );
      throw new Error(
        "Failed to delete user from members: " + deleteMemberError.message,
      );
    }

    console.log("User deleted from members:", userId);

    return { success: true };
  } catch (err) {
    console.error("Unexpected error during user deletion:", err);
    throw err;
  }
}

export async function updateUser(
  userId: string,
  data: {
    email?: string;
    password?: string;
    role?: "admin" | "editor" | "developer";
    name?: string;
  },
): Promise<void> {
  const supabase = await createAdminClient();

  try {
    const { error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        email: data.email,
        password: data.password,
      },
    );

    if (authError) {
      throw new Error(`Failed to update user in auth: ${authError.message}`);
    }

    const memberPayload: Record<string, unknown> = {};
    if (data.name !== undefined) memberPayload.name = data.name;
    if (data.role !== undefined) memberPayload.role = data.role;

    if (Object.keys(memberPayload).length > 0) {
      const { error: memberError } = await supabase
        .from("members")
        .update(memberPayload)
        .eq("id", userId);

      if (memberError) {
        throw new Error(
          `Failed to update user in members: ${memberError.message}`,
        );
      }
    }
  } catch (error) {
    console.error("Error in updateUser:", error);
    throw error;
  }
}

export async function changeOwnPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createServerClientInstance();

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Not authenticated");
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return {
        success: false,
        message: "Current password is incorrect",
      };
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new Error(`Failed to update password: ${updateError.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in changeOwnPassword:", error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────────────────────────────────────

export async function createProject({
  title,
  desc,
  image,
  website,
  github,
  tagIds,
}: {
  title: string;
  desc: string;
  image?: File | null;
  website?: string;
  github?: string;
  tagIds?: string[];
}): Promise<void> {
  const supabase = await createServerClientInstance();

  try {
    // Oversæt beskrivelse
    const first = await translateWithDeepL(desc, "EN");
    const sourceLang = first.detected_source_language.toLowerCase();

    let desc_translated = first.text;
    if (sourceLang === "en") {
      const second = await translateWithDeepL(desc, "DA");
      desc_translated = second.text;
    }

    let imageUrl: string | null = null;
    if (image) {
      const uploadFile = async (file: File) => {
        const ext = "webp";
        const name = `${Math.random().toString(36).slice(2)}.${ext}`;
        const { data: ud, error: ue } = await supabase.auth.getUser();
        if (ue || !ud?.user) throw new Error("Not authenticated");
        const path = `project-images/${ud.user.id}/${name}`;
        const buf = await sharp(Buffer.from(await file.arrayBuffer()))
          .rotate()
          .resize({ width: 1024, height: 768, fit: "cover" })
          .webp({ quality: 65 })
          .toBuffer();
        await supabase.storage.from("project-images").upload(path, buf, {
          contentType: "image/webp",
        });
        const { data } = await supabase.storage
          .from("project-images")
          .getPublicUrl(path);
        return data.publicUrl!;
      };
      imageUrl = await uploadFile(image);
    }

    const { data: ud, error: ue } = await supabase.auth.getUser();
    if (ue || !ud?.user) throw new Error("Not authenticated");

    const { data: created, error } = await supabase
      .from("projects")
      .insert({
        title,
        desc,
        desc_translated,
        source_lang: sourceLang,
        image: imageUrl,
        creator_id: ud.user.id,
        website,
        github,
      })
      .select("id")
      .single();
    if (error) throw error;

    if (created?.id && tagIds && tagIds.length > 0) {
      const rows = tagIds.map((tagId) => ({
        project_id: created.id,
        tag_id: tagId,
      }));
      const { error: tagError } = await supabase
        .from("project_tags")
        .insert(rows);
      if (tagError) throw tagError;
    }
  } catch (err) {
    console.error("createProject error:", err);
    throw err;
  }
}

export async function updateProject(
  id: string,
  title: string,
  desc: string,
  image: File | null,
  website?: string,
  github?: string,
  tagIds?: string[],
): Promise<void> {
  const supabase = await createServerClientInstance();

  try {
    // Oversæt beskrivelse
    const first = await translateWithDeepL(desc, "EN");
    const sourceLang = first.detected_source_language.toLowerCase();

    let desc_translated = first.text;
    if (sourceLang === "en") {
      const second = await translateWithDeepL(desc, "DA");
      desc_translated = second.text;
    }

    let imageUrl: string | null = null;
    if (image) {
      const uploadFile = async (file: File) => {
        const ext = "webp";
        const name = `${Math.random().toString(36).slice(2)}.${ext}`;
        const { data: ud, error: ue } = await supabase.auth.getUser();
        if (ue || !ud?.user) throw new Error("Not authenticated");
        const path = `project-images/${ud.user.id}/${name}`;
        const buf = await sharp(Buffer.from(await file.arrayBuffer()))
          .rotate()
          .resize({ width: 1024, height: 768, fit: "cover" })
          .webp({ quality: 65 })
          .toBuffer();
        await supabase.storage.from("project-images").upload(path, buf, {
          contentType: "image/webp",
        });
        const { data } = await supabase.storage
          .from("project-images")
          .getPublicUrl(path);
        return data.publicUrl!;
      };
      imageUrl = await uploadFile(image);
    } else {
      const { data: existing } = await supabase
        .from("projects")
        .select("image")
        .eq("id", id)
        .single();
      imageUrl = existing?.image ?? null;
    }

    const { data: ud, error: ue } = await supabase.auth.getUser();
    if (ue || !ud?.user) throw new Error("Not authenticated");

    const payload: {
      title: string;
      desc: string;
      desc_translated: string;
      source_lang: string;
      image: string | null;
      website?: string;
      github?: string;
      updated_at?: string;
    } = {
      title,
      desc,
      desc_translated,
      source_lang: sourceLang,
      image: imageUrl,
      website,
      github,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("projects")
      .update(payload)
      .eq("id", id);
    if (error) throw error;

    if (tagIds) {
      const { error: deleteError } = await supabase
        .from("project_tags")
        .delete()
        .eq("project_id", id);
      if (deleteError) throw deleteError;

      if (tagIds.length > 0) {
        const rows = tagIds.map((tagId) => ({
          project_id: id,
          tag_id: tagId,
        }));
        const { error: tagError } = await supabase
          .from("project_tags")
          .insert(rows);
        if (tagError) throw tagError;
      }
    }
  } catch (err) {
    console.error("updateProject error:", err);
    throw err;
  }
}

export async function getAllProjects(page = 1, limit = 6) {
  const supabase = await createServerClientInstance();
  const offset = (page - 1) * limit;
  const { data, count, error } = await supabase
    .from("projects")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return { projects: data, total: count ?? 0 };
}

/** Projects for client home: alle projekter med tags fra project_tags + tags. */
export async function getProjectsForHomePage(limit = 12) {
  const supabase = await createServerClientInstance();
  const { data: projectsData, error } = await supabase
    .from("projects")
    .select(
      "id, title, desc, desc_translated, source_lang, image, website, github, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  const projectIds = (projectsData ?? []).map((p) => p.id);
  if (projectIds.length === 0) return { projects: [] };

  const { data: links, error: linksError } = await supabase
    .from("project_tags")
    .select("project_id, tag_id")
    .in("project_id", projectIds);
  if (linksError) throw new Error(linksError.message);

  const tagIds = [...new Set((links ?? []).map((l) => l.tag_id))];
  const tagNames: Record<string, string> = {};
  if (tagIds.length > 0) {
    const { data: tagRows, error: tagsError } = await supabase
      .from("tags")
      .select("id, name")
      .in("id", tagIds);
    if (!tagsError && tagRows) {
      tagRows.forEach((t) => {
        tagNames[t.id] = t.name;
      });
    }
  }

  const tagsByProject: Record<string, { id: string; name: string }[]> = {};
  (links ?? []).forEach((row) => {
    const name = tagNames[row.tag_id];
    if (!name) return;
    if (!tagsByProject[row.project_id]) tagsByProject[row.project_id] = [];
    tagsByProject[row.project_id].push({ id: row.tag_id, name });
  });

  const projects = (projectsData ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    desc: p.desc,
    desc_translated: p.desc_translated,
    source_lang: p.source_lang ?? "en",
    image: p.image,
    website: p.website || undefined,
    github: p.github || undefined,
    created_at: p.created_at,
    tags: tagsByProject[p.id] ?? [],
  }));

  return { projects };
}

export async function getProjectsCount() {
  const supabase = await createServerClientInstance();
  const { count, error } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true });

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getProjectById(projectId: string) {
  const supabase = await createServerClientInstance();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id,title,desc,desc_translated,source_lang,image,website,github,created_at,updated_at,project_tags(tag_id)",
    )
    .eq("id", projectId)
    .single();
  if (error) throw new Error(error.message);
  const tagIds =
    data?.project_tags?.map((row: { tag_id: string }) => row.tag_id) ?? [];
  return { ...data, tag_ids: tagIds };
}

export async function deleteProject(projectId: string): Promise<void> {
  const supabase = await createServerClientInstance();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);
  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOG
// ─────────────────────────────────────────────────────────────────────────────

export async function createBlog({
  content,
  images,
  sharedFacebook = false,
  sharedInstagram = false,
}: {
  content: string;
  images?: File[];
  sharedFacebook?: boolean;
  sharedInstagram?: boolean;
}): Promise<{ linkFacebook?: string; linkInstagram?: string }> {
  try {
    // Input validation
    if (!content || content.trim().length === 0) {
      throw new Error("Content is required");
    }

    const supabase = await createServerClientInstance();

    if (!process.env.DEEPL_API_KEY) {
      throw new Error("Translation service not configured");
    }

    // Authenticate user
    const { data: ud, error: ue } = await supabase.auth.getUser();
    if (ue || !ud?.user) {
      throw new Error("Not authenticated");
    }

    // Translate content
    let content_translated = content;
    let sourceLang = "da";

    try {
      const first = await translateWithDeepL(content, "EN");
      sourceLang = first.detected_source_language?.toLowerCase() || "da";
      content_translated = first.text;

      if (sourceLang === "en") {
        const second = await translateWithDeepL(content, "DA");
        content_translated = second.text;
      }
    } catch (contentError) {
      console.error("Content translation error:", contentError);
      // Continue with original content if translation fails
      content_translated = content;
    }

    // Insert blog into database
    const { data: blogData, error: insertError } = await supabase
      .from("blogs")
      .insert([
        {
          content,
          content_translated,
          source_lang: sourceLang,
          creator_id: ud.user.id,
        },
      ])
      .select("id")
      .single();

    if (insertError || !blogData?.id) {
      console.error("Database insert error:", insertError);
      throw new Error("Failed to create blog in database");
    }

    // Upload images and collect URLs - only after blog is created
    const imageUrls: string[] = [];
    if (images?.length) {
      try {
        await Promise.all(
          images.map(async (file, index) => {
            const ext = "webp";
            const name = `${Math.random().toString(36).slice(2)}.${ext}`;
            const path = `${ud.user.id}/${name}`;

            try {
              const buf = await sharp(Buffer.from(await file.arrayBuffer()))
                .rotate()
                .resize({ width: 1080, height: 1350, fit: "cover" })
                .webp({ quality: 80 })
                .toBuffer();

              // Log buffer size after processing
              console.log("Buffer size after processing:", buf.length);

              const { error: uploadError } = await supabase.storage
                .from("blog-images")
                .upload(path, buf, {
                  contentType: "image/webp",
                });

              if (uploadError) {
                console.error("Image upload error:", uploadError);
                return; // Skip this image but continue with others
              }

              // Get public URL
              const publicUrlData = supabase.storage
                .from("blog-images")
                .getPublicUrl(path);

              if (!publicUrlData.data?.publicUrl) {
                console.error("Public URL generation failed for path:", path);
                return; // Skip this image but continue with others
              }

              console.log(
                "Public URL generated:",
                publicUrlData.data.publicUrl,
              );
              imageUrls.push(publicUrlData.data.publicUrl);

              await supabase.from("blog_images").insert({
                blog_id: blogData.id,
                path,
                sort_order: index,
              });
            } catch (imageProcessingError) {
              console.error("Image processing error:", imageProcessingError);
            }
          }),
        );
      } catch (imageError) {
        console.error("General image upload error:", imageError);
        // Continue without images if upload fails
      }
    }

    // Post to Facebook if requested
    let fbResult: { link?: string } | null = null;
    if (sharedFacebook) {
      try {
        console.log("🔄 [SERVER] Attempting Facebook post...");
        const fbMessage = content;
        fbResult = await postToFacebookPage({
          message: fbMessage,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        });

        if (fbResult?.link) {
          console.log(
            "✅ [SERVER] Facebook post successful, updating database...",
          );
          await supabase
            .from("blogs")
            .update({
              linkFacebook: fbResult.link,
              sharedFacebook: true,
            })
            .eq("id", blogData.id);
        }
      } catch (fbError) {
        console.error("❌ [SERVER] Failed to post to Facebook:", fbError);
        // Don't fail the entire blog creation if Facebook fails
        // Just log the error and continue
      }
    }

    // Post to Instagram if requested (requires at least one image)
    let igResult: { success: boolean; id?: string; permalink?: string } | null =
      null;
    if (sharedInstagram) {
      if (imageUrls.length === 0) {
        throw new Error(
          "Instagram kræver mindst ét billede for at dele et opslag",
        );
      }

      try {
        console.log("🔄 [SERVER] Attempting Instagram post...");
        const igCaption = content;
        igResult = await postToInstagram({
          caption: igCaption,
          imageUrls: imageUrls, // Send alle billeder til Instagram
        });

        if (igResult?.success && igResult?.id) {
          console.log(
            "✅ [SERVER] Instagram post successful, updating database...",
          );

          // Use permalink if available, otherwise just store the ID (we'll handle display in the frontend)
          const instagramLink =
            igResult.permalink || `Instagram Media ID: ${igResult.id}`;

          await supabase
            .from("blogs")
            .update({
              linkInstagram: instagramLink,
              sharedInstagram: true,
            })
            .eq("id", blogData.id);
        }
      } catch (igError) {
        console.error("❌ [SERVER] Failed to post to Instagram:", igError);
        // Re-throw Instagram errors since they are likely validation errors
        throw igError;
      }
    }

    return {
      linkFacebook: fbResult?.link,
      linkInstagram:
        igResult?.success && igResult?.id
          ? igResult.permalink || `Instagram Media ID: ${igResult.id}`
          : undefined,
    };
  } catch (error) {
    console.error("createBlog error:", error);

    // Re-throw with a sanitized error message for production
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("An unexpected error occurred while creating blog");
    }
  }
}

interface BlogImage {
  path: string;
  sort_order: number;
}

export async function getAllBlogs(page = 1, limit = 6) {
  const supabase = await createServerClientInstance();
  const offset = (page - 1) * limit;
  const {
    data: blogData,
    count,
    error,
  } = await supabase
    .from("blogs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  // Hent blog_images separat (virker uden FK mellem blogs og blog_images)
  const blogIds = blogData?.map((b) => b.id) ?? [];
  const imagesByBlogId: Record<number, BlogImage[]> = {};
  if (blogIds.length > 0) {
    const { data: imageRows } = await supabase
      .from("blog_images")
      .select("blog_id, path, sort_order")
      .in("blog_id", blogIds);
    for (const row of imageRows ?? []) {
      if (!imagesByBlogId[row.blog_id]) imagesByBlogId[row.blog_id] = [];
      imagesByBlogId[row.blog_id].push({
        path: row.path,
        sort_order: row.sort_order,
      });
    }
  }

  const transformedBlogs =
    blogData?.map((blogItem) => {
      const blogImages =
        imagesByBlogId[blogItem.id]?.sort(
          (a, b) => a.sort_order - b.sort_order,
        ) ?? [];
      const images = blogImages.map((img) => {
        const { data: publicUrlData } = supabase.storage
          .from("blog-images")
          .getPublicUrl(img.path);
        return publicUrlData.publicUrl;
      });

      return {
        ...blogItem,
        images,
      };
    }) ?? [];

  return { blogs: transformedBlogs, total: count ?? 0 };
}

export async function getBlogsCount() {
  const supabase = await createServerClientInstance();
  const { count, error } = await supabase
    .from("blogs")
    .select("*", { count: "exact", head: true });

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getBlogById(blogId: number) {
  const supabase = await createServerClientInstance();
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", blogId)
    .single();
  if (error) throw new Error(error.message);

  const { data: blogImageRows } = await supabase
    .from("blog_images")
    .select("path, sort_order")
    .eq("blog_id", blogId);

  const images = (blogImageRows ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => {
      const { data: publicUrlData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(img.path);
      return {
        url: publicUrlData.publicUrl,
        path: img.path,
      };
    });

  return {
    ...data,
    images,
  };
}

export async function deleteBlog(blogId: number): Promise<void> {
  const supabase = await createServerClientInstance();

  // Get blog data before deletion to check for Facebook and Instagram posts
  const { data: blogData } = await supabase
    .from("blogs")
    .select("linkFacebook, linkInstagram")
    .eq("id", blogId)
    .single();

  // Delete Facebook post if it exists
  if (blogData?.linkFacebook) {
    try {
      console.log(
        "🔍 [deleteBlog] Found Facebook link:",
        blogData.linkFacebook,
      );
      const postId = blogData.linkFacebook.split("/").pop();
      if (postId) {
        console.log(
          "🗑️ [deleteBlog] Attempting to delete Facebook post:",
          postId,
        );
        await deleteFacebookPost(postId);
      } else {
        console.log("⚠️ [deleteBlog] Could not extract Facebook post ID");
      }
    } catch (error) {
      console.error("Failed to delete Facebook post:", error);
      // Continue with blog deletion even if Facebook deletion fails
    }
  }

  // Delete Instagram post if it exists
  if (blogData?.linkInstagram) {
    console.log(
      "⚠️ [deleteBlog] Instagram post found but cannot be deleted automatically via API",
    );
    console.log("🔍 [deleteBlog] Instagram link:", blogData.linkInstagram);
    console.log(
      "ℹ️ [deleteBlog] Please manually delete the Instagram post if needed",
    );
    // Note: Instagram API does not support programmatic deletion of posts
    // The post will need to be manually deleted on Instagram
  }

  // 1. Hent alle billeder tilknyttet bloggen
  const { data: images, error: imagesError } = await supabase
    .from("blog_images")
    .select("path")
    .eq("blog_id", blogId);
  if (imagesError) throw new Error(imagesError.message);

  // 2. Slet billeder fra storage
  if (images && images.length > 0) {
    const paths = images.map((img: { path: string }) => img.path);
    const { error: storageError } = await supabase.storage
      .from("blog-images")
      .remove(paths);
    if (storageError) throw new Error(storageError.message);
  }

  // 3. Slet rækker fra blog_images
  const { error: deleteImagesError } = await supabase
    .from("blog_images")
    .delete()
    .eq("blog_id", blogId);
  if (deleteImagesError) throw new Error(deleteImagesError.message);

  // 4. Slet selve bloggen
  const { error } = await supabase.from("blogs").delete().eq("id", blogId);
  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllRequests(page: number = 1, limit: number = 6) {
  const supabase = await createServerClientInstance();
  const offset = (page - 1) * limit;

  try {
    const { data, count, error } = await supabase
      .from("requests")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(
        `Failed to fetch requests: ${error.message || "Unknown error"}`,
      );
    }

    return { requests: data || [], total: count || 0 };
  } catch (err) {
    console.error("Unexpected error during fetching requests:", err);
    throw err;
  }
}

export async function deleteRequest(requestId: string): Promise<void> {
  const supabase = await createServerClientInstance();

  try {
    const { error } = await supabase
      .from("requests")
      .delete()
      .eq("id", requestId);

    if (error) {
      throw new Error(`Failed to delete request: ${error.message}`);
    }
  } catch (error) {
    console.error("Error in deleteRequest:", error);
    throw error;
  }
}

export async function updateRequest(
  requestId: string,
  data: {
    company?: string;
    category?: string;
    mobile?: string;
    mail?: string;
    message?: string;
    address?: string;
    city?: string;
  },
): Promise<void> {
  const supabase = await createServerClientInstance();

  try {
    const { error } = await supabase
      .from("requests")
      .update(data)
      .eq("id", requestId);

    if (error) {
      throw new Error(`Failed to update request: ${error.message}`);
    }
  } catch (error) {
    console.error("Error in updateRequest:", error);
    throw error;
  }
}

export async function getRequestById(requestId: string) {
  const supabase = await createServerClientInstance();

  try {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch request by ID: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error("Unexpected error during fetching request by ID:", err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUSH NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gemmer push subscription i Supabase
 * @param subscription - PushSubscription objekt fra browseren
 * @param userId - Optional user ID hvis brugeren er logget ind
 * @param userAgent - Optional user agent string (browser/device info)
 */
export async function savePushSubscription(
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  userId?: string,
  userAgent?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientInstance();

  try {
    // Konverter subscription til JSON format
    const subscriptionData = {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_id: userId || null,
      user_agent: userAgent || null,
      created_at: new Date().toISOString(),
    };

    // Tjek om subscription allerede findes (baseret på endpoint)
    const { data: existing } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("endpoint", subscription.endpoint)
      .maybeSingle();

    if (existing) {
      // Opdater eksisterende subscription
      const { error } = await supabase
        .from("push_subscriptions")
        .update({
          p256dh: subscriptionData.p256dh,
          auth: subscriptionData.auth,
          user_id: subscriptionData.user_id,
          user_agent: subscriptionData.user_agent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Opret ny subscription
      const { error } = await supabase
        .from("push_subscriptions")
        .insert([subscriptionData]);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Sletter push subscription fra Supabase
 */
export async function deletePushSubscription(
  endpoint: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientInstance();

  try {
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Opdaterer push notification preference for en bruger
 */
export async function updateUserPushNotificationPreference(
  userId: string,
  enabled: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientInstance();

  try {
    const { error } = await supabase
      .from("members")
      .update({ push_notifications_enabled: enabled })
      .eq("id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Opretter notifikationer for admin/developer brugere når en ny request oprettes
 */
export async function createNotificationForAdmins(
  requestId: number,
  displayName: string,
  roles: ("admin" | "developer")[],
  notificationType: string = "kontakt",
): Promise<void> {
  const supabase = await createAdminClient();

  try {
    // Hent alle brugere med de angivne roller
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("id")
      .in("role", roles);

    if (membersError) {
      console.error("Fejl ved hentning af medlemmer:", membersError);
      throw new Error(`Failed to fetch members: ${membersError.message}`);
    }

    if (!members || members.length === 0) {
      console.log("Ingen medlemmer fundet med de angivne roller");
      return;
    }

    // Opret notifikationer for hver bruger
    const notifications = members.map((member) => ({
      user_id: member.id,
      request_id: requestId,
      message: `Ny kontakt fra ${displayName}`,
      notification_type: notificationType,
      is_read: false,
    }));

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (insertError) {
      console.error("Fejl ved oprettelse af notifikationer:", insertError);
      throw new Error(`Failed to create notifications: ${insertError.message}`);
    }

    // Send push notifications
    const userIds = members.map((m) => m.id);
    const { sendPushNotificationsToUsers } =
      await import("@/lib/server/subscribe");

    await sendPushNotificationsToUsers(userIds, {
      title: "Ny kontakt",
      body: `Ny kontakt fra ${displayName}`,
      tag: notificationType,
      url: `/admin/messages?requestId=${requestId}`,
      requestId: requestId,
    });
  } catch (error) {
    console.error("Error in createNotificationForAdmins:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVE SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

type Session = {
  id: string;
  user_agent: string | null;
  ip: string | null;
  created_at: string;
  updated_at: string | null;
  not_after: string | null;
  is_current: boolean;
};

/**
 * Henter alle aktive sessioner fra Supabase Auth for den aktuelle bruger
 */
export async function getActiveSessions(): Promise<{
  success: boolean;
  sessions?: Session[];
  error?: string;
}> {
  const supabase = await createAdminClient();

  try {
    // Hent nuværende bruger
    const userSupabase = await createServerClientInstance();
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Ikke autentificeret" };
    }

    // Hent den aktuelle session
    const {
      data: { session: currentSession },
    } = await userSupabase.auth.getSession();

    // Få session ID fra JWT token
    let currentSessionId: string | null = null;
    if (currentSession?.access_token) {
      try {
        // Decode JWT payload (base64url decode middle part)
        const payloadBase64 = currentSession.access_token.split(".")[1];
        const payloadJson = Buffer.from(payloadBase64, "base64url").toString(
          "utf-8",
        );
        const payload = JSON.parse(payloadJson);
        currentSessionId = payload.session_id;
      } catch (e) {
        console.error("Failed to decode session ID from JWT:", e);
      }
    }

    // Brug direkte SQL query via RPC for at hente sessions fra auth schema
    const { data: authSessions, error: sessionsError } = await supabase.rpc(
      "get_user_sessions",
      { target_user_id: user.id },
    );

    if (sessionsError) {
      return { success: false, error: sessionsError.message };
    }

    // Map sessions og marker den aktuelle
    const sessions: Session[] = (authSessions || []).map(
      (session: {
        id: string;
        user_agent: string | null;
        ip: string | null;
        created_at: string;
        updated_at: string | null;
        not_after: string | null;
      }) => ({
        id: session.id,
        user_agent: session.user_agent,
        ip: session.ip,
        created_at: session.created_at,
        updated_at: session.updated_at,
        not_after: session.not_after,
        is_current: currentSessionId ? session.id === currentSessionId : false,
      }),
    );

    return { success: true, sessions };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Ukendt fejl",
    };
  }
}

/**
 * Fjerner en specifik session fra Supabase Auth
 */
export async function revokeSession(
  sessionId: string,
): Promise<{ success: boolean; error?: string }> {
  const adminSupabase = await createAdminClient();

  try {
    // Hent nuværende bruger
    const userSupabase = await createServerClientInstance();
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Ikke autentificeret" };
    }

    // Brug RPC til at slette session
    const { error } = await adminSupabase.rpc("delete_user_session", {
      target_user_id: user.id,
      target_session_id: sessionId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Ukendt fejl",
    };
  }
}

/**
 * Fjerner alle sessioner undtagen den nuværende
 */
export async function revokeAllOtherSessions(): Promise<{
  success: boolean;
  error?: string;
  count?: number;
}> {
  const adminSupabase = await createAdminClient();

  try {
    // Hent nuværende bruger og session
    const userSupabase = await createServerClientInstance();
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Ikke autentificeret" };
    }

    // Hent nuværende session ID
    const {
      data: { session: currentSession },
    } = await userSupabase.auth.getSession();

    let currentSessionId: string | null = null;
    if (currentSession?.access_token) {
      try {
        const payload = JSON.parse(
          atob(currentSession.access_token.split(".")[1]),
        );
        currentSessionId = payload.session_id;
      } catch (e) {
        console.error("Failed to decode session ID from JWT:", e);
        return {
          success: false,
          error: "Kunne ikke identificere nuværende session",
        };
      }
    }

    if (!currentSessionId) {
      return {
        success: false,
        error: "Kunne ikke identificere nuværende session",
      };
    }

    // Hent alle sessioner
    const { data: authSessions, error: sessionsError } =
      await adminSupabase.rpc("get_user_sessions", { target_user_id: user.id });

    if (sessionsError) {
      return { success: false, error: sessionsError.message };
    }

    // Filtrer alle sessioner undtagen den nuværende
    const sessionsToRevoke = (authSessions || []).filter(
      (session: { id: string }) => session.id !== currentSessionId,
    );

    if (sessionsToRevoke.length === 0) {
      return { success: true, count: 0 };
    }

    // Slet alle andre sessioner
    let revokedCount = 0;
    for (const session of sessionsToRevoke) {
      const { error } = await adminSupabase.rpc("delete_user_session", {
        target_user_id: user.id,
        target_session_id: session.id,
      });
      if (!error) {
        revokedCount++;
      }
    }

    return { success: true, count: revokedCount };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Ukendt fejl",
    };
  }
}

//REQUEST NOTES

export async function createRequestNote(
  message: string,
  requestId: string,
): Promise<{ id: string; message: string; created_at: string }> {
  const supabase = await createServerClientInstance();

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("notes")
      .insert([
        {
          message: message,
          request_id: requestId,
          creator: userData.user.id,
        },
      ])
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create request note: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in createRequestNote:", error);
    throw error;
  }
}

export async function getNotesByRequestId(requestId: string) {
  const supabase = await createServerClientInstance();

  try {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("request_id", requestId);

    if (error) {
      throw new Error(`Failed to fetch notes: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error("Unexpected error during fetching notes:", err);
    throw err;
  }
}

export async function deleteRequestNote(noteId: string): Promise<void> {
  const supabase = await createServerClientInstance();

  try {
    const { error } = await supabase.from("notes").delete().eq("id", noteId);

    if (error) {
      throw new Error(`Failed to delete request note: ${error.message}`);
    }
  } catch (error) {
    console.error("Error in deleteRequestNote:", error);
    throw error;
  }
}
