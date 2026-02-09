"use server";

import { createAdminClient } from "@/utils/supabase/server";
import { createServerClientInstance } from "@/utils/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// PUSH NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sender push notifications til brugere baseret på deres subscriptions
 */
export async function sendPushNotificationsToUsers(
  userIds: string[],
  notification: {
    title: string;
    body: string;
    tag?: string;
    url?: string;
    requestId?: string | number;
  }
): Promise<{ success: boolean; sent: number; errors: number }> {
  let webpush: typeof import("web-push") | null = null;
  try {
    webpush = await import("web-push");
  } catch {
    return { success: false, sent: 0, errors: 0 };
  }

  const supabase = await createAdminClient();
  let sent = 0;
  let errors = 0;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || "noreply@arzonic.com";

  if (!publicKey || !privateKey) {
    return { success: false, sent: 0, errors: 0 };
  }

  webpush.setVapidDetails(`mailto:${vapidEmail}`, publicKey, privateKey);

  const { data: subscriptions, error: subError } = await supabase
    .from("push_subscriptions")
    .select("*")
    .in("user_id", userIds);

  if (subError || !subscriptions || subscriptions.length === 0) {
    return { success: true, sent: 0, errors: 0 };
  }

  const { data: members } = await supabase
    .from("members")
    .select("id, push_notifications_enabled")
    .in("id", userIds);

  const preferencesMap = new Map(
    (members || []).map((m) => [m.id, m.push_notifications_enabled ?? true])
  );

  for (const sub of subscriptions) {
    const userEnabled = preferencesMap.get(sub.user_id) ?? true;
    if (!userEnabled) {
      continue;
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify({
          title: notification.title,
          body: notification.body,
          tag: notification.tag || "default",
          url: notification.url || "/admin/messages",
          requestId: notification.requestId || null,
        })
      );
      sent++;
    } catch (error: unknown) {
      errors++;

      if (
        error &&
        typeof error === "object" &&
        "statusCode" in error &&
        ((error as { statusCode: number }).statusCode === 410 ||
          (error as { statusCode: number }).statusCode === 404)
      ) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
      }
    }
  }

  return { success: true, sent, errors };
}

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
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientInstance();

  try {
    const subscriptionData = {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_id: userId || null,
      user_agent: userAgent || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          ...subscriptionData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "endpoint",
          ignoreDuplicates: false,
        }
      );

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
 * Sletter push subscription fra Supabase
 */
export async function deletePushSubscription(
  endpoint: string
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
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientInstance();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Ikke autentificeret" };
  }

  if (user.id !== userId) {
    return { success: false, error: "Ikke autoriseret til at opdatere denne bruger" };
  }

  try {
    const { error } = await supabase
      .from("members")
      .update({ push_notifications_enabled: enabled })
      .eq("id", userId);

    if (error) {
      const adminSupabase = await createAdminClient();
      const { error: adminError } = await adminSupabase
        .from("members")
        .update({ push_notifications_enabled: enabled })
        .eq("id", userId);

      if (adminError) {
        return { success: false, error: adminError.message };
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
 * Opdaterer dashboard notification preference for en bruger
 */
export async function updateUserDashboardNotificationPreference(
  userId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClientInstance();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Ikke autentificeret" };
  }

  if (user.id !== userId) {
    return { success: false, error: "Ikke autoriseret til at opdatere denne bruger" };
  }

  try {
    const { error } = await supabase
      .from("members")
      .update({ dashboard_notifications_enabled: enabled })
      .eq("id", userId);

    if (error) {
      const adminSupabase = await createAdminClient();
      const { error: adminError } = await adminSupabase
        .from("members")
        .update({ dashboard_notifications_enabled: enabled })
        .eq("id", userId);

      if (adminError) {
        return { success: false, error: adminError.message };
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
