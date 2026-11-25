import {
  getToken,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";

import { getFirebaseMessaging } from "../firebase/firebase";

const VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY;

const SERVICE_WORKER_PATH =
  "/firebase-messaging-sw.js";

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error(
      "This browser does not support service workers."
    );
  }

  try {
    const registration =
      await navigator.serviceWorker.register(
        SERVICE_WORKER_PATH
      );

    console.log(
      "Firebase service worker registered:",
      registration.scope
    );

    await navigator.serviceWorker.ready;

    return registration;
  } catch (error: any) {
    console.error(
      "Failed to register Firebase messaging service worker:",
      error
    );

    throw new Error(
      error?.message ||
        "Unable to register push notification service worker."
    );
  }
}

export async function requestPushToken(): Promise<string | null> {
  if (!("Notification" in window)) {
    throw new Error(
      "This browser does not support notifications."
    );
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error(
      "This browser does not support service workers."
    );
  }

  if (!VAPID_KEY) {
    throw new Error(
      "Firebase VAPID key is not configured."
    );
  }

  let permission =
    Notification.permission;

  if (permission !== "granted") {
    permission =
      await Notification.requestPermission();
  }

  if (permission !== "granted") {
    throw new Error(
      "Notification permission was not granted."
    );
  }

  const registration =
    await registerPushServiceWorker();

  const messaging =
    await getFirebaseMessaging();

  if (!messaging) {
    throw new Error(
      "Firebase messaging is not supported in this browser."
    );
  }

  const token = await getToken(
    messaging,
    {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration:
        registration,
    }
  );

  if (!token) {
    throw new Error(
      "Firebase did not return an FCM token."
    );
  }

  return token;
}

export async function listenForForegroundMessages(
  handler: (
    payload: MessagePayload
  ) => void
): Promise<() => void> {
  const messaging =
    await getFirebaseMessaging();

  if (!messaging) {
    throw new Error(
      "Firebase messaging is not supported in this browser."
    );
  }

  const unsubscribe = onMessage(
    messaging,
    (payload) => {
      console.log(
        "Foreground FCM message received:",
        payload
      );

      handler(payload);
    }
  );

  return unsubscribe;
}

export function showForegroundNotification(
  payload: MessagePayload
) {
  if (
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  const title =
    payload.notification?.title ||
    payload.data?.title ||
    "RoomEase Notification";

  const body =
    payload.notification?.body ||
    payload.data?.body ||
    "You have a new notification.";

  const notification =
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}