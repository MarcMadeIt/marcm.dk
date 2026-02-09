"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaBell, FaCommentDots } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { getRequestNamesByIds } from "@/lib/server/client-actions";

const formatTime = (iso: string, locale: string) => {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const isDa = locale.toLowerCase().startsWith("da");
  const tooltipFormatter = new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const tooltip = tooltipFormatter.format(date);

  if (
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate()
  ) {
    if (diffMs >= 0 && diffMs < 5 * 60 * 1000) {
      return { label: isDa ? "Lige nu" : "Just now", tooltip };
    }

    const totalMinutes = Math.max(1, Math.floor(diffMs / (60 * 1000)));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    let label: string;

    if (isDa) {
      label = hours > 0 ? `${hours}t` : `${minutes}m`;
    } else {
      label = hours > 0 ? `${hours}h` : `${minutes}m`;
    }
    return { label, tooltip };
  }

  const isYesterday =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() - date.getDate() === 1;

  if (isYesterday) {
    return { label: isDa ? "Igår" : "Yesterday", tooltip };
  }

  const label = new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return { label, tooltip };
};

const NotificationList = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const { notifications, unreadCount, markAllAsRead, markAsRead } =
    useNotifications();
  const hasNotifications = notifications.length > 0;
  const [requestNames, setRequestNames] = useState<Map<number | string, string>>(
    new Map()
  );

  // Hent company navne fra requests tabellen for notifikationer uden message
  useEffect(() => {
    const fetchRequestNames = async () => {
      const requestIds = notifications
        .filter(
          (n) =>
            n.request_id &&
            (n.notification_type === "request" || n.notification_type === "kontakt") &&
            (!n.message || n.message === "kunde")
        )
        .map((n) => n.request_id)
        .filter((id, index, self) => self.indexOf(id) === index);

      if (requestIds.length === 0) return;

      const missingIds = requestIds.filter((id) => !requestNames.has(id));
      if (missingIds.length === 0) return;

      try {
        const data = await getRequestNamesByIds(missingIds);
        if (data?.length) {
          setRequestNames((currentNames) => {
            const updatedNames = new Map(currentNames);
            data.forEach(
              (request: { id: number | string; company: string | null }) => {
                const displayName =
                  (request.company && request.company.trim()) || "";
                if (displayName) {
                  updatedNames.set(request.id, displayName);
                }
              }
            );
            return updatedNames;
          });
        }
      } catch (error) {
        console.error("Failed to fetch request names:", error);
      }
    };

    fetchRequestNames();
  }, [notifications, requestNames]);

  const getDisplayName = (item: {
    message: string;
    request_id: number | string;
    notification_type: string;
  }) => {
    // Brug message hvis det ikke er tomt eller "kunde"
    if (item.message && item.message !== "kunde") {
      return item.message;
    }
    // Fallback til request company fra databasen
    if ((item.notification_type === "request" || item.notification_type === "kontakt") && item.request_id) {
      const companyName = requestNames.get(item.request_id);
      if (companyName) return companyName;
    }
    return "kunde";
  };

  const getNotificationTitle = (notificationType: string) => {
    if (notificationType === "kontakt") {
      return t("new_contact", "Ny kontakt");
    }
    return t("new_request", { company: "" }).trim() || "Ny henvendelse";
  };

  const headerSubtitle = useMemo(() => {
    if (hasNotifications) return "";
    return t("no_notifications") || "No notifications";
  }, [hasNotifications, t]);

  const handleOpen = () => {
    markAllAsRead();
  };

  const closeDropdown = () => {
    triggerRef.current?.blur();
    menuRef.current?.blur();
    const active = document.activeElement as HTMLElement | null;
    active?.blur();
  };

  const handleSelect = async (
    notificationId: string,
    requestId?: number | string | null
  ) => {
    closeDropdown();
    await markAsRead(notificationId);
    const idStr =
      requestId !== null && requestId !== undefined ? String(requestId) : "";
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(idStr);
    router.push(
      isUuid ? `/admin/messages?requestId=${idStr}` : "/admin/messages"
    );
  };

  return (
    <div ref={dropdownRef} className="dropdown dropdown-bottom dropdown-end">
      <div
        ref={triggerRef}
        tabIndex={0}
        role="button"
        className="btn btn-ghost md:btn-md m-1 text-lg"
        aria-label={t("aria.topbar.moreOptions")}
        onClick={handleOpen}
      >
        <div className="indicator">
          {unreadCount > 0 && (
            <span className="indicator-item badge badge-secondary badge-sm">
              {unreadCount}
            </span>
          )}
          <FaBell size={24} />
        </div>
      </div>
      <ul
        ref={menuRef}
        tabIndex={0}
        className="dropdown-content menu bg-base-200 border-2 border-base-300 rounded-box shadow-lg overflow-x-hidden w-60"
      >
        <div className="flex flex-col items-center">
          <span className="font-semibold">{t("notifications.title")}</span>
          {!hasNotifications && (
            <span className="text-sm text-base-content/60">
              {headerSubtitle}
            </span>
          )}
        </div>
        {hasNotifications ? (
          <div className="mt-2 max-h-72 overflow-y-auto space-y-2 w-full overflow-x-visible">
            {notifications.map((item) => {
              const time = formatTime(item.created_at, i18n.language);
              return (
                <li
                  key={item.id}
                  className="p-0 w-full rounded-lg hover:bg-base-300 transition-colors cursor-pointer  flex flex-col gap-1 lg:tooltip tooltip-bottom"
                  onClick={() => handleSelect(item.id, item.request_id)}
                  data-tip={time.tooltip}
                  tabIndex={0}
                >
                  <div className="flex items-center gap-2 w-full relative">
                    {!item.is_read && (
                      <span className="absolute top-2 left-2 status status-success" />
                    )}
                    <div className="w-6 h-6 flex items-center justify-center flex-none">
                      <FaCommentDots
                        className="text-base-content/70"
                        size={20}
                      />
                    </div>
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="font-medium leading-tight flex items-center gap-2 text-secondary">
                        {getNotificationTitle(item.notification_type)}
                      </span>

                      <span className="text-sm text-base-content/70">
                        {getDisplayName(item)}
                      </span>
                    </div>
                    <span className="text-[11px] text-base-content/70 whitespace-nowrap ">
                      {time.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </div>
        ) : (
          <></>
        )}
      </ul>
    </div>
  );
};

export default NotificationList;
