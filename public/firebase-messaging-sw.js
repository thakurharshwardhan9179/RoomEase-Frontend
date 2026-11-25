/* global importScripts, firebase */

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyA4KzRIziVkQg7npKQ3Uk11q8xWoWUxbJY",
  authDomain: "roommanage-3ed61.firebaseapp.com",
  projectId: "roommanage-3ed61",
  storageBucket: "roommanage-3ed61.firebasestorage.app",
  messagingSenderId: "342192608416",
  appId: "1:342192608416:web:498a2cbbf3e2a9a51a25c5"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Background message:",
    payload
  );

  const title =
    payload?.notification?.title ||
    payload?.data?.title ||
    "RoomEase Notification";

  const body =
    payload?.notification?.body ||
    payload?.data?.body ||
    "You have a new RoomEase notification.";

  self.registration.showNotification(title, {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: payload?.data || {},
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();

          if ("navigate" in client) {
            client.navigate(targetUrl);
          }

          return;
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});