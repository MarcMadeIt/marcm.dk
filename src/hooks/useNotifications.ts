"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface Notification {
  id: string;
  request_id: number;
  message: string;
  is_read: boolean;
  notification_type: string;
  created_at: string;
}

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const clearPoll = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const startPoll = (userId: string) => {
      clearPoll();
      pollRef.current = setInterval(async () => {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (!isMounted) return;
        setNotifications(data || []);
        setUnreadCount((data || []).filter((n) => !n.is_read).length);
      }, 8000);
    };

    async function fetchNotifications() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }
      const { data: member } = await supabase
        .from("members")
        .select("role, dashboard_notifications_enabled")
        .eq("id", user.id)
        .single();

      if (!member || !["admin", "developer"].includes(member.role)) {
        if (isMounted) setLoading(false);
        return;
      }

      // Tjek om dashboard notifikationer er slået fra
      const dashboardEnabled = member.dashboard_notifications_enabled ?? true;

      if (!dashboardEnabled) {
        // Dashboard notifikationer er slået fra - vis ikke nogen notifikationer
        if (isMounted) {
          setNotifications([]);
          setUnreadCount(0);
          setLoading(false);
        }
        return;
      }

      const { data, count } = await supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (isMounted) {
        setNotifications(data || []);
        setUnreadCount(
          (data || []).filter((n) => n.is_read === false).length ?? count ?? 0
        );
        setLoading(false);
      }

      // Kun opsæt realtime hvis dashboard notifikationer er slået til
      if (dashboardEnabled) {
        // Create a unique channel name
        const channelName = `user-notifications-${user.id}-${Date.now()}`;

        // Clean up existing channel if any
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
        }

        const newChannel = supabase
          .channel(channelName, {
            config: {
              broadcast: { self: false },
              presence: { key: user.id },
            },
          })
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const notif = payload.new as Notification;
              if (!isMounted) return;

              // Ensure created_at exists
              if (!notif.created_at) {
                notif.created_at = new Date().toISOString();
              }

              setNotifications((prev) => {
                // Check if notification already exists
                const exists = prev.some(
                  (existing) =>
                    existing.id === notif.id ||
                    (existing.request_id === notif.request_id &&
                      existing.notification_type === notif.notification_type)
                );

                if (exists) return prev;

                // Add new notification at the beginning
                return [notif, ...prev];
              });

              // Increment unread count if notification is unread
              if (!notif.is_read) {
                setUnreadCount((prev) => prev + 1);
              }
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              clearPoll();
            } else if (
              status === "CHANNEL_ERROR" ||
              status === "TIMED_OUT" ||
              status === "CLOSED"
            ) {
              startPoll(user.id);
            }
          });

        channelRef.current = newChannel;
      }
    }

    fetchNotifications();

    return () => {
      isMounted = false;
      clearPoll();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [supabase]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    setUnreadCount((prev) => Math.max(0, prev - 1));
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markAsReadByRequestId = async (requestId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Find all unread notifications for this request_id
    const unreadNotifs = notifications.filter(
      (n) => String(n.request_id) === requestId && !n.is_read
    );

    if (unreadNotifs.length === 0) return;

    // Mark them as read in database
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("request_id", requestId)
      .eq("is_read", false);

    // Update local state
    setUnreadCount((prev) => Math.max(0, prev - unreadNotifs.length));
    setNotifications((prev) =>
      prev.map((n) =>
        String(n.request_id) === requestId ? { ...n, is_read: true } : n
      )
    );
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    markAsReadByRequestId,
  };
}
