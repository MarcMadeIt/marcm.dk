"use client";

import Navbar from "@/components/admin/layout/Navbar";
import Topbar from "@/components/admin/layout/Topbar";
import SettingsModal from "@/components/admin/layout/settings/UserSettingsModal";
import { UserSettingsModalProvider } from "@/components/admin/layout/settings/UserSettingsModalContext";
import { useEffect } from "react";
import { subscribeToPush } from "@/utils/push-notifications";
import { registerPushSubscription } from "@/lib/server/client-actions";
import { checkIsAdminOrDeveloper } from "@/lib/auth/readUserSession";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const registerServiceWorkerForAdmins = async () => {
      if (!("serviceWorker" in navigator)) return;

      try {
        const { isAuthorized, userId } = await checkIsAdminOrDeveloper();

        if (!isAuthorized || !userId) return;

        await navigator.serviceWorker.register("/sw.js");

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

        if (vapidPublicKey) {
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const subscription = await subscribeToPush(vapidPublicKey);
          if (subscription) {
            const subscriptionJson = subscription.toJSON();

            if (!subscriptionJson.endpoint || !subscriptionJson.keys) {
              console.error("Invalid subscription format");
              return;
            }

            const result = await registerPushSubscription(
              {
                endpoint: subscriptionJson.endpoint,
                keys: {
                  p256dh: subscriptionJson.keys.p256dh!,
                  auth: subscriptionJson.keys.auth!,
                },
              },
              userId,
              navigator.userAgent
            );

            if (!result.success) {
              console.error("Fejl ved gemning af subscription:", result.error);
            }
          }
        }
      } catch (error) {
        console.error("Fejl ved registrering af service worker:", error);
      }
    };

    registerServiceWorkerForAdmins();
  }, []);

  return (
    <UserSettingsModalProvider>
      <div className="flex flex-col sm:flex-row sm:h-lvh h-dvh relative bg-base-100">
        <Navbar />
        <div className="p-3 w-full sm:pl-[238px] xl:pl-[300px] flex flex-col gap-3 pb-28 md:pb-0">
          <Topbar />
          {children}
        </div>
        <SettingsModal />
      </div>
    </UserSettingsModalProvider>
  );
}
