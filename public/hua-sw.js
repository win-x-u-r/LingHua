// Loaded into the app's service worker (see workbox.importScripts in vite.config.ts).
// Tapping one of Hua's reminders opens LingHua, or brings an open tab to the front.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((tabs) => {
      for (const tab of tabs) {
        if ("focus" in tab) {
          tab.navigate(url);
          return tab.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

// Hua's daily reminder, sent by the server (backend/send_reminders.py) even when
// LingHua is closed. Shows on the lock screen and in the notification shade.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Hua", {
      body: data.body || "Ready for a little Mandarin today?",
      icon: "/favicon-192.png",
      badge: "/favicon-192.png",
      tag: "hua-daily",
      lang: data.lang || "en",
      dir: data.lang === "ar" ? "rtl" : "ltr",
      data: { url: data.url || "/flashcards" },
    }),
  );
});
