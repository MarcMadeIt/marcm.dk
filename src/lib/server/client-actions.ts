"use server";

import { createClient } from "@/utils/supabase/client";
import { createAdminClient } from "@/utils/supabase/server";
import { createNotificationForAdmins } from "./actions";

export async function getAllCases(page: number = 1, limit: number = 3) {
  const supabase = createClient();
  const offset = (page - 1) * limit;

  try {
    const { data, count, error } = await supabase
      .from("cases")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch cases: ${error.message}`);
    }

    return { cases: data, total: count || 0 };
  } catch (err) {
    console.error("Unexpected error during fetching cases:", err);
    throw err;
  }
}

export async function getLatestCases() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error("Failed to fetch latest cases: " + error.message);
  }

  return data;
}

export async function getRequestNamesByIds(requestIds: (number | string)[]) {
  if (!requestIds.length) return [];
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("requests")
    .select("id, company")
    .in("id", requestIds);

  if (error) {
    console.error("Failed to fetch request names:", error.message);
    throw error;
  }

  return data || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// JOBS
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllActiveJobs() {
  const supabase = createClient();

  try {
    const { data, count, error } = await supabase
      .from("jobs")
      .select("*", { count: "exact" })
      .eq("active", true)
      .order("created_at", { ascending: false });

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

export async function getJobBySlug(slug: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.error("Job fetch error:", error.message);
    return null;
  }

  return data;
}

export async function deactivateExpiredJobs() {
  const supabase = await createAdminClient();

  const { error } = await supabase.rpc("update_job_active_status");

  if (error) {
    console.error("Fejl ved deaktivering af jobs:", error.message);
    throw new Error("Kunne ikke deaktivere jobs");
  }

  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// JOBS APPLY
// ─────────────────────────────────────────────────────────────────────────────

export async function createApplication({
  job_id,
  name,
  mobile,
  mail,
  consent,
  slug,
  cv,
  application,
}: {
  job_id: string;
  name: string;
  mobile: string;
  mail: string;
  consent: boolean;
  slug: string;
  cv: File;
  application: File;
}): Promise<{ success: boolean; message?: string }> {
  const supabase = createClient();

  const sanitize = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

  const safeName = sanitize(name);
  const id = Math.floor(1000 + Math.random() * 9000);
  const cvPath = `cv/${slug}_${id}_${safeName}.pdf`;
  const applicationPath = `application/${slug}_${id}_${safeName}.pdf`;

  try {
    // 1) Tjek om mail allerede har søgt
    const { data: mailExists, error: mailError } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", job_id)
      .eq("mail", mail)
      .maybeSingle();

    if (mailError) {
      console.error("❌ DB check error (mail):", mailError.message);
      return { success: false, message: "generic" };
    }

    if (mailExists) {
      return { success: false, message: "mail-already-applied" };
    }

    // 2) Tjek om mobil allerede har søgt
    const { data: mobileExists, error: mobileError } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", job_id)
      .eq("mobile", mobile)
      .maybeSingle();

    if (mobileError) {
      console.error("❌ DB check error (mobile):", mobileError.message);
      return { success: false, message: "generic" };
    }

    if (mobileExists) {
      return { success: false, message: "mobile-already-applied" };
    }

    // 3) Hent IP
    let ip = "unknown";
    try {
      ip = await fetch("https://api64.ipify.org?format=json")
        .then((res) => res.json())
        .then((data) => data.ip);
    } catch (ipErr) {
      console.warn("⚠️ IP fetch failed:", ipErr);
    }

    // 4) Insert i DB
    const { error: insertError } = await supabase.from("applications").insert({
      job_id,
      name,
      mobile,
      mail,
      consent,
      consent_timestamp: new Date().toISOString(),
      ip_address: ip,
      cv: cvPath,
      application: applicationPath,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        if (insertError.message.includes("unique_mail_per_job")) {
          return { success: false, message: "mail-already-applied" };
        }
        if (insertError.message.includes("unique_mobile_per_job")) {
          return { success: false, message: "mobile-already-applied" };
        }
      }

      throw new Error(insertError.message);
    }

    // 5) Upload filer EFTER insert
    const { error: cvErr } = await supabase.storage
      .from("applications-files")
      .upload(cvPath, cv, { upsert: false });

    if (cvErr) throw new Error("CV upload failed");

    const { error: appErr } = await supabase.storage
      .from("applications-files")
      .upload(applicationPath, application, { upsert: false });

    if (appErr) throw new Error("Application upload failed");

    return { success: true };
  } catch (err: unknown) {
    console.error("❌ createApplication:", (err as Error).message);

    return {
      success: false,
      message:
        (err as Error).message === "mail-already-applied" ||
        (err as Error).message === "mobile-already-applied"
          ? (err as Error).message
          : (err as Error).message || "generic",
    };
  }
}
// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────────────────────

export async function getLatestReviews() {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      throw new Error("Failed to fetch latest reviews: " + error.message);
    }

    return data;
  } catch (err) {
    console.error("Unexpected error during fetching reviews:", err);
    throw err;
  }
}

export async function createRequest(
  company: string,
  mobile: string,
  mail: string,
  consent: boolean,
  message: string,
): Promise<void> {
  const supabase = await createAdminClient();

  try {
    const ipResponse = await fetch("https://api64.ipify.org?format=json");
    const ipData = await ipResponse.json();
    const ipAddress = ipData.ip;

    const consentTimestamp = consent ? new Date().toISOString() : null;
    const { data: request, error } = await supabase
      .from("requests")
      .insert([
        {
          company,
          mobile,
          mail,
          consent,
          message,
          consent_timestamp: consentTimestamp,
          ip_address: ipAddress,
          terms_version: "v1.0",
        },
      ])
      .select()
      .single();

    if (error || !request) {
      console.error(`❌ Fejl ved oprettelse af request:`, error);
      throw new Error(`Failed to create request: ${error?.message}`);
    }

    console.log(`✅ Request oprettet med ID: ${request.id}`);

    // Create notifications for admins/developers using service role
    const displayName = (company && company.trim()) || "kunde";

    console.log(
      `🔔 Kalder createNotificationForAdmins for request ${request.id}`,
    );
    await createNotificationForAdmins(request.id, displayName, [
      "admin",
      "developer",
    ]);
    console.log(`✅ createNotificationForAdmins færdig`);
  } catch (error) {
    console.error("Error in createRequest:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUSH NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function registerPushSubscription(
  subscriptionData: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  userId?: string,
  userAgent?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { savePushSubscription } = await import("@/lib/server/subscribe");

    return await savePushSubscription(subscriptionData, userId, userAgent);
  } catch (error) {
    console.error("Fejl ved registrering af push subscription:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUSH NOTIFICATION PREFERENCES
// ─────────────────────────────────────────────────────────────────────────────

export async function updatePushNotificationPreference(
  userId: string,
  enabled: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Importer og kald server action direkte
    const { updateUserPushNotificationPreference } =
      await import("@/lib/server/subscribe");

    return await updateUserPushNotificationPreference(userId, enabled);
  } catch (error) {
    console.error(
      "Fejl ved opdatering af push notification preference:",
      error,
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
