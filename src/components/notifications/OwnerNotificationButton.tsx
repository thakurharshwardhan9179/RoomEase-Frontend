import {
  Bell,
  BellOff,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  listenForForegroundMessages,
  requestPushToken,
} from "../../utils/pushNotifications";

import {
  getOwnerNotificationStatus,
  registerOwnerDevice,
  unregisterOwnerDevice,
} from "../../api/notifications.api";

export default function OwnerNotificationButton() {
  const [loading, setLoading] =
    useState(true);

  const [working, setWorking] =
    useState(false);

  const [enabled, setEnabled] =
    useState(false);

  const [message, setMessage] =
    useState("");

  /*
   * IMPORTANT:
   * Firebase setup already exists in your project.
   * We are only using the existing requestPushToken()
   * and listenForForegroundMessages().
   */

  const syncNotificationStatus =
    useCallback(async () => {
      try {
        setLoading(true);

        if (
          typeof window ===
            "undefined" ||
          !("Notification" in window)
        ) {
          setEnabled(false);
          return;
        }

        /*
         * Browser permission itself is not enough.
         * Backend registration is the source of truth.
         */
        if (
          Notification.permission !==
          "granted"
        ) {
          setEnabled(false);
          return;
        }

        /*
         * Your existing function is used.
         * Because permission is already granted,
         * this should return the current FCM token
         * without showing the permission popup again.
         */
        const fcmToken =
          await requestPushToken();

        if (!fcmToken) {
          setEnabled(false);
          return;
        }

        const status =
          await getOwnerNotificationStatus(
            fcmToken
          );

        setEnabled(
          Boolean(
            status?.isRegistered
          )
        );
      } catch (error) {
        console.error(
          "OWNER NOTIFICATION STATUS ERROR:",
          error
        );

        /*
         * If status cannot be verified,
         * do not falsely show Enabled.
         */
        setEnabled(false);
      } finally {
        setLoading(false);
      }
    }, []);

  /*
   * Foreground notification listener
   * Existing behavior preserved.
   */
  useEffect(() => {
    let unsubscribe:
      | (() => void)
      | null = null;

    const setup = async () => {
      try {
        unsubscribe =
          await listenForForegroundMessages(
            (payload) => {
              console.log(
                "OWNER FOREGROUND PUSH:",
                payload
              );

              const title =
                payload?.notification
                  ?.title ||
                "RoomEase";

              const body =
                payload?.notification
                  ?.body ||
                "New notification received.";

              setMessage(
                `${title}: ${body}`
              );

              /*
               * A push can reveal that the browser/
               * token is still active, but backend remains
               * the final source of truth.
               */
              void syncNotificationStatus();
            }
          );
      } catch (error) {
        console.error(
          "Owner foreground messaging error:",
          error
        );
      }
    };

    void setup();

    return () => {
      unsubscribe?.();
    };
  }, [syncNotificationStatus]);

  /*
   * IMPORTANT:
   * Check status when sidebar component loads.
   */
  useEffect(() => {
    void syncNotificationStatus();

    /*
     * When user comes back to the tab,
     * re-check backend truth.
     */
    const handleFocus = () => {
      void syncNotificationStatus();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [syncNotificationStatus]);

  const enableNotifications =
    async () => {
      try {
        setWorking(true);
        setMessage(
          "Requesting notification permission..."
        );

        console.log(
          "OWNER: requesting FCM token..."
        );

        /*
         * Existing Firebase implementation.
         * This is the same call that already works.
         */
        const fcmToken =
          await requestPushToken();

        console.log(
          "OWNER FCM TOKEN:",
          fcmToken
        );

        if (!fcmToken) {
          setEnabled(false);

          throw new Error(
            "Notification permission was not granted or FCM token was not generated."
          );
        }

        setMessage(
          "Registering this device..."
        );

        const response =
          await registerOwnerDevice(
            fcmToken
          );

        console.log(
          "OWNER REGISTER DEVICE RESPONSE:",
          response
        );

        /*
         * Never blindly assume success.
         * Immediately verify backend state.
         */
        const status =
          await getOwnerNotificationStatus(
            fcmToken
          );

        const registered =
          Boolean(
            status?.isRegistered
          );

        setEnabled(
          registered
        );

        setMessage(
          registered
            ? "Notifications enabled."
            : "Device registration could not be verified."
        );
      } catch (error: any) {
        console.error(
          "OWNER PUSH ERROR:",
          error
        );

        console.error(
          "OWNER PUSH RESPONSE:",
          error?.response
        );

        setEnabled(false);

        setMessage(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Unable to enable notifications."
        );
      } finally {
        setWorking(false);
      }
    };

  const disableNotifications =
    async () => {
      try {
        setWorking(true);
        setMessage(
          "Disabling notifications..."
        );

        if (
          typeof window ===
          "undefined"
        ) {
          setEnabled(false);
          return;
        }

        /*
         * Backend unregister needs the exact
         * current browser FCM token.
         */
        const fcmToken =
          await requestPushToken();

        if (!fcmToken) {
          /*
           * There is no registered FCM token available.
           * Treat frontend state as OFF.
           */
          setEnabled(false);

          setMessage(
            "Notifications are already off on this browser."
          );

          return;
        }

        await unregisterOwnerDevice(
          fcmToken
        );

        /*
         * Verify after unregister.
         */
        const status =
          await getOwnerNotificationStatus(
            fcmToken
          );

        const registered =
          Boolean(
            status?.isRegistered
          );

        setEnabled(
          registered
        );

        setMessage(
          registered
            ? "Notifications are still registered."
            : "Notifications disabled."
        );
      } catch (error: any) {
        console.error(
          "OWNER DISABLE PUSH ERROR:",
          error
        );

        /*
         * If unregister request failed,
         * don't pretend it worked.
         */
        await syncNotificationStatus();

        setMessage(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Unable to disable notifications."
        );
      } finally {
        setWorking(false);
      }
    };

  if (loading) {
    return (
      <div className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-slate-500">
        <Loader2
          className="h-4 w-4 animate-spin text-slate-400"
        />

        <span>
          Checking notifications...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={working}
        onClick={() =>
          void (
            enabled
              ? disableNotifications()
              : enableNotifications()
          )
        }
        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
          enabled
            ? "text-emerald-700 hover:bg-emerald-50"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
            enabled
              ? "bg-emerald-50 text-emerald-600"
              : "bg-slate-100 text-slate-400 group-hover:bg-white"
          }`}
        >
          {working ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : enabled ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-extrabold">
            Notifications
          </span>

          <span
            className={`mt-0.5 block text-[10px] font-medium ${
              enabled
                ? "text-emerald-600"
                : "text-slate-400"
            }`}
          >
            {enabled
              ? "Enabled"
              : "Disabled"}
          </span>
        </span>

        <span
          className={`h-2 w-2 rounded-full ${
            enabled
              ? "bg-emerald-500"
              : "bg-slate-300"
          }`}
        />
      </button>

      {message && (
        <div
          className={`mt-1 flex items-start gap-2 px-3 text-[10px] leading-4 ${
            message
              .toLowerCase()
              .includes("unable")
              ? "text-rose-600"
              : "text-slate-400"
          }`}
        >
          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />

          <span>{message}</span>
        </div>
      )}
    </div>
  );
}