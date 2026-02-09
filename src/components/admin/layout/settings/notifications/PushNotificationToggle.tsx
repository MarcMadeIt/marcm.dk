"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createClient } from "@/utils/supabase/client";
import { updateUserPushNotificationPreference, updateUserDashboardNotificationPreference } from "@/lib/server/subscribe";

const PushNotificationToggle = () => {
  const { t } = useTranslation();
  const [pushEnabled, setPushEnabled] = useState<boolean | null>(null);
  const [dashboardEnabled, setDashboardEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPush, setSavingPush] = useState(false);
  const [savingDashboard, setSavingDashboard] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: member, error } = await supabase
        .from("members")
        .select("push_notifications_enabled, dashboard_notifications_enabled")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Fejl ved hentning af notification preferences:", error);
        setPushEnabled(true);
        setDashboardEnabled(true);
      } else if (member) {
        setPushEnabled(member.push_notifications_enabled ?? true);
        setDashboardEnabled(member.dashboard_notifications_enabled ?? true);
      } else {
        setPushEnabled(true);
        setDashboardEnabled(true);
      }

      setLoading(false);
    };

    fetchPreferences();
  }, []);

  const handlePushToggle = async (checked: boolean) => {
    setSavingPush(true);
    const previousValue = pushEnabled;

    setPushEnabled(checked);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("Bruger ikke fundet");
        setPushEnabled(previousValue);
        setSavingPush(false);
        return;
      }

      const result = await updateUserPushNotificationPreference(user.id, checked);

      if (!result.success) {
        console.error("Fejl ved opdatering:", result.error);
        setPushEnabled(previousValue);
      }
    } catch (error) {
      console.error("Fejl ved opdatering af push notification preference:", error);
      setPushEnabled(previousValue);
    } finally {
      setSavingPush(false);
    }
  };

  const handleDashboardToggle = async (checked: boolean) => {
    setSavingDashboard(true);
    const previousValue = dashboardEnabled;

    setDashboardEnabled(checked);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("Bruger ikke fundet");
        setDashboardEnabled(previousValue);
        setSavingDashboard(false);
        return;
      }

      const result = await updateUserDashboardNotificationPreference(user.id, checked);

      if (!result.success) {
        console.error("Fejl ved opdatering:", result.error);
        setDashboardEnabled(previousValue);
      }
    } catch (error) {
      console.error("Fejl ved opdatering af dashboard notification preference:", error);
      setDashboardEnabled(previousValue);
    } finally {
      setSavingDashboard(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Push Notifications Toggle */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <>
            <div className="skeleton h-5 w-full"></div>
            <div className="flex items-center justify-between gap-4">
              <div className="skeleton h-4 flex-1"></div>
              <div className="skeleton h-6 w-12 rounded-full shrink-0"></div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h5 className="font-semibold text-sm md:text-base">
                {t("notifications.push")}
              </h5>
              <p className="text-sm text-base-content/70">
                {t("notifications.push_description")}
              </p>
            </div>
              <input
                type="checkbox"
                checked={pushEnabled ?? false}
                onChange={(e) => handlePushToggle(e.target.checked)}
                disabled={savingPush || loading}
                className="toggle toggle-primary"
              />
          </div>
        )}
      </div>
  
      {/* Dashboard Notifications Toggle */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <>
            <div className="skeleton h-5 w-full"></div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <div className="skeleton h-4 w-full"></div>
                <div className="skeleton h-4 w-full"></div>
              </div>
              <div className="skeleton h-6 w-full max-w-12 rounded-full shrink-0"></div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h5 className="font-semibold text-sm md:text-base">
                {t("notifications.dashboard")}
              </h5>
              <p className="text-sm text-base-content/70">
                {t("notifications.dashboard_description")}
              </p>
            </div>
            <input
              type="checkbox"
              checked={dashboardEnabled ?? false}
              onChange={(e) => handleDashboardToggle(e.target.checked)}
              disabled={savingDashboard || loading}
              className="toggle toggle-primary"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PushNotificationToggle;
