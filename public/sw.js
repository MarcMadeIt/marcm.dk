// Service Worker for Push Notifications
const SW_VERSION = "2.4.0";

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
    let data;
    try {
        data = event.data ? event.data.json() : { title: "Ny besked", body: "" };
    } catch {
        data = { title: "Ny besked", body: "" };
    }

    const options = {
        body: data.body,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: data.tag || "default",
        requireInteraction: false,
        vibrate: [200, 100, 200],
        data: {
            requestId: data.requestId || null,
        },
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const notificationData = event.notification.data || {};
    const requestId = notificationData.requestId;

    // Byg target URL med absolute path
    const targetUrl = requestId
        ? `${self.location.origin}/admin/messages?requestId=${requestId}`
        : `${self.location.origin}/admin/messages`;

    event.waitUntil(
        Promise.all([
            // Mark notification as read via API
            requestId ? fetch(`${self.location.origin}/api/notifications/mark-read`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ requestId }),
                credentials: "include",
            }).catch((error) => {
                console.error("Failed to mark notification as read:", error);
            }) : Promise.resolve(),

            // Navigate to the target page
            clients.matchAll({
                type: "window",
                includeUncontrolled: true
            }).then((clientList) => {
                // Søg efter et eksisterende PWA vindue (standalone mode)
                for (const client of clientList) {
                    // Tjek om det er vores admin app
                    if (client.url.includes("/admin")) {
                        // Naviger til den specifikke henvendelse og fokuser
                        return client.navigate(targetUrl).then((client) => {
                            if (client) {
                                return client.focus();
                            }
                        });
                    }
                }

                // Hvis ingen PWA vindue findes, åbn et nyt
                return clients.openWindow(targetUrl);
            })
        ])
    );
});
