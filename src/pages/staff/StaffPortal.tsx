import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
} from "react";

import {
  Bell,
  BellOff,
  Camera,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  Loader2,
  LogOut,
  RefreshCw,
  UserRound,
  X,
} from "lucide-react";

import { useParams } from "react-router-dom";

import {
  acceptPublicTaskByActionToken,
  completePublicTaskByActionToken,
  getStaffNotificationStatus,
  getStaffPortalTasks,
  registerStaffDevice,
  unregisterStaffDevice,
  type StaffPortalTask,
} from "../../api/staffPortal.api";

import {
  requestPushToken,
} from "../../utils/pushNotifications";

function formatDate(
  value?: string | null
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: string) {
  if (status === "InProgress") {
    return "In Progress";
  }

  return status;
}

function statusClass(status: string) {
  if (status === "Completed") {
    return "bg-[#E8EFE8] text-[#356248]";
  }

  if (status === "InProgress") {
    return "bg-[#EDF1F3] text-[#5C7180]";
  }

  return "bg-[#F7EEDC] text-[#9B712F]";
}

function getErrorMessage(
  err: any,
  fallback: string
) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

const ALLOWED_PROOF_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_PROOF_SIZE = 5 * 1024 * 1024;

export default function StaffPortal() {
  const {
    staffAccessToken,
  } = useParams<{
    staffAccessToken: string;
  }>();

  const [staffName, setStaffName] =
    useState("");

  const [tasks, setTasks] =
    useState<StaffPortalTask[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    workingTaskId,
    setWorkingTaskId,
  ] = useState<string | null>(null);

  const [error, setError] =
    useState("");

  // ----------------------------------------
  // PROOF PHOTO STATE
  // ----------------------------------------

  const [
    completionTask,
    setCompletionTask,
  ] = useState<StaffPortalTask | null>(
    null
  );

  const [
    proofFile,
    setProofFile,
  ] = useState<File | null>(null);

  const [
    proofPreview,
    setProofPreview,
  ] = useState("");

  const [
    proofError,
    setProofError,
  ] = useState("");

  // ----------------------------------------
  // NOTIFICATION STATE
  // ----------------------------------------

  const [
    notificationEnabled,
    setNotificationEnabled,
  ] = useState(false);

  const [
    notificationLoading,
    setNotificationLoading,
  ] = useState(true);

  const [
    notificationWorking,
    setNotificationWorking,
  ] = useState(false);

  const [
    notificationMessage,
    setNotificationMessage,
  ] = useState("");

  // ----------------------------------------
  // LOAD STAFF PORTAL
  // ----------------------------------------

  const loadPortal = useCallback(
    async (
      showLoader = true
    ) => {
      if (!staffAccessToken) {
        setError(
          "Staff portal link is missing."
        );

        setLoading(false);
        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const response =
          await getStaffPortalTasks(
            staffAccessToken
          );

        setStaffName(
          response?.staffName ||
            "Staff"
        );

        setTasks(
          Array.isArray(
            response?.tasks
          )
            ? response.tasks
            : []
        );
      } catch (err: any) {
        setError(
          getErrorMessage(
            err,
            "Unable to load staff portal."
          )
        );

        setTasks([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [staffAccessToken]
  );

  useEffect(() => {
    void loadPortal(true);
  }, [loadPortal]);

  // ----------------------------------------
  // CHECK NOTIFICATION STATUS
  // ----------------------------------------

  const syncNotificationStatus =
    useCallback(async () => {
      try {
        setNotificationLoading(true);

        setNotificationMessage("");

        if (
          typeof window ===
            "undefined" ||
          !("Notification" in window)
        ) {
          setNotificationEnabled(
            false
          );

          return;
        }

        if (
          Notification.permission !==
          "granted"
        ) {
          setNotificationEnabled(
            false
          );

          return;
        }

        const fcmToken =
          await requestPushToken();

        if (!fcmToken) {
          setNotificationEnabled(
            false
          );

          return;
        }

        const status =
          await getStaffNotificationStatus(
            staffAccessToken!,
            fcmToken
          );

        setNotificationEnabled(
          Boolean(
            status?.isRegistered
          )
        );
      } catch (err) {
        console.error(
          "STAFF NOTIFICATION STATUS ERROR:",
          err
        );

        setNotificationEnabled(
          false
        );
      } finally {
        setNotificationLoading(
          false
        );
      }
    }, [staffAccessToken]);

  // ----------------------------------------
  // STATUS CHECK ON LOAD + TAB FOCUS
  // ----------------------------------------

  useEffect(() => {
    if (!staffAccessToken) {
      return;
    }

    void syncNotificationStatus();

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
  }, [
    staffAccessToken,
    syncNotificationStatus,
  ]);

  // ----------------------------------------
  // ENABLE / DISABLE NOTIFICATIONS
  // ----------------------------------------

  const toggleNotifications =
    async () => {
      try {
        setNotificationWorking(
          true
        );

        setNotificationMessage("");

        // ENABLE
        if (!notificationEnabled) {
          const fcmToken =
            await requestPushToken();

          if (!fcmToken) {
            throw new Error(
              "Notification permission was not granted or FCM token was not generated."
            );
          }

          await registerStaffDevice(
            staffAccessToken!,
            fcmToken
          );

          const status =
            await getStaffNotificationStatus(
              staffAccessToken!,
              fcmToken
            );

          const registered =
            Boolean(
              status?.isRegistered
            );

          setNotificationEnabled(
            registered
          );

          setNotificationMessage(
            registered
              ? "Notifications enabled."
              : "Device registration could not be verified."
          );

          return;
        }

        // DISABLE
        const fcmToken =
          await requestPushToken();

        if (!fcmToken) {
          setNotificationEnabled(
            false
          );

          setNotificationMessage(
            "Notifications are already off on this browser."
          );

          return;
        }

        await unregisterStaffDevice(
          staffAccessToken!,
          fcmToken
        );

        const status =
          await getStaffNotificationStatus(
            staffAccessToken!,
            fcmToken
          );

        const registered =
          Boolean(
            status?.isRegistered
          );

        setNotificationEnabled(
          registered
        );

        setNotificationMessage(
          registered
            ? "Notifications are still registered."
            : "Notifications disabled."
        );
      } catch (err: any) {
        console.error(
          "STAFF NOTIFICATION ERROR:",
          err
        );

        await syncNotificationStatus();

        setNotificationMessage(
          getErrorMessage(
            err,
            "Unable to update notifications."
          )
        );
      } finally {
        setNotificationWorking(
          false
        );
      }
    };

  // ----------------------------------------
  // TASK ACCEPT
  // ----------------------------------------

  const handleAcceptTask =
    async (
      task: StaffPortalTask
    ) => {
      if (!task.actionToken) {
        alert(
          "This task does not have an action token."
        );

        return;
      }

      try {
        setWorkingTaskId(
          task.taskId
        );

        await acceptPublicTaskByActionToken(
          task.actionToken
        );

        await loadPortal(false);
      } catch (err: any) {
        alert(
          getErrorMessage(
            err,
            "Unable to accept task."
          )
        );
      } finally {
        setWorkingTaskId(null);
      }
    };

  // ----------------------------------------
  // OPEN COMPLETE MODAL
  // ----------------------------------------

  const openCompletionModal =
    (task: StaffPortalTask) => {
      if (!task.actionToken) {
        alert(
          "This task does not have an action token."
        );

        return;
      }

      setProofError("");
      setProofFile(null);
      setProofPreview("");
      setCompletionTask(task);
    };

  // ----------------------------------------
  // CLOSE COMPLETE MODAL
  // ----------------------------------------

  const closeCompletionModal =
    () => {
      if (workingTaskId) {
        return;
      }

      setCompletionTask(null);
      setProofFile(null);
      setProofPreview("");
      setProofError("");
    };

  // ----------------------------------------
  // SELECT PROOF PHOTO
  // ----------------------------------------

  const handleProofPhotoChange =
    (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      setProofError("");

      const file =
        event.target.files?.[0];

      if (!file) {
        setProofFile(null);
        setProofPreview("");
        return;
      }

      if (
        !ALLOWED_PROOF_TYPES.includes(
          file.type
        )
      ) {
        setProofFile(null);
        setProofPreview("");

        event.target.value = "";

        setProofError(
          "Only JPG, PNG and WEBP images are allowed."
        );

        return;
      }

      if (
        file.size > MAX_PROOF_SIZE
      ) {
        setProofFile(null);
        setProofPreview("");

        event.target.value = "";

        setProofError(
          "Proof photo must be 5 MB or smaller."
        );

        return;
      }

      setProofFile(file);

      const previewUrl =
        URL.createObjectURL(file);

      setProofPreview(
        previewUrl
      );
    };

  // ----------------------------------------
  // COMPLETE TASK WITH PROOF
  // ----------------------------------------

  const submitTaskCompletion =
    async () => {
      setProofError("");

      if (!completionTask) {
        return;
      }

      if (!completionTask.actionToken) {
        setProofError(
          "This task does not have an action token."
        );

        return;
      }

      if (!proofFile) {
        setProofError(
          "Proof photo is required to complete this task."
        );

        return;
      }

      try {
        setWorkingTaskId(
          completionTask.taskId
        );

        await completePublicTaskByActionToken(
          completionTask.actionToken,
          proofFile
        );

        setCompletionTask(
          null
        );

        setProofFile(null);
        setProofPreview("");
        setProofError("");

        await loadPortal(false);
      } catch (err: any) {
        setProofError(
          getErrorMessage(
            err,
            "Unable to complete task."
          )
        );
      } finally {
        setWorkingTaskId(null);
      }
    };

  // ----------------------------------------
  // OPEN TASK LINK
  // ----------------------------------------

  const openTaskLink = (
    actionToken?: string | null
  ) => {
    if (!actionToken) {
      alert(
        "Task action link is not available."
      );

      return;
    }

    const link =
      `${window.location.origin}/task/${encodeURIComponent(
        actionToken
      )}`;

    window.open(
      link,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ----------------------------------------
  // LOADING
  // ----------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F0] p-4 sm:p-6">
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
          <div className="flex items-center gap-2.5 rounded-xl bg-white px-5 py-4 shadow-sm border border-[#E3E6DE]">
            <Loader2 className="h-4 w-4 animate-spin text-[#356248]" />

            <span className="text-xs font-medium text-[#294436]">
              Loading staff portal...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased pb-10">
        <div className="w-full px-4 py-5 sm:px-6 sm:py-8 lg:px-8 space-y-5">

          {/* HEADER */}
          <header className="rounded-xl border border-[#E3E6DE] bg-white shadow-sm">
            <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">

              {/* LEFT */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1D4435] text-white shadow-sm">
                  <UserRound
                    size={18}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-sm font-medium tracking-tight text-[#294436]">
                      RoomEase Staff Portal
                    </h1>

                    <span className="hidden rounded-md bg-[#E8EFE8] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-[#356248] sm:inline-flex">
                      Staff
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs text-[#859083]">
                    {staffName
                      ? `Welcome, ${staffName}`
                      : "Staff Portal"}
                  </p>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex flex-wrap gap-2">

                {/* NOTIFICATION */}
                <button
                  type="button"
                  onClick={() =>
                    void toggleNotifications()
                  }
                  disabled={
                    notificationLoading ||
                    notificationWorking
                  }
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    notificationEnabled
                      ? "bg-[#356248] text-white hover:bg-[#295640]"
                      : "border border-[#E3E6DE] bg-white text-[#40543E] hover:bg-[#F2F4EC]"
                  }`}
                >
                  {notificationWorking ? (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  ) : notificationEnabled ? (
                    <Bell size={14} />
                  ) : (
                    <BellOff size={14} />
                  )}

                  {notificationWorking
                    ? "Updating..."
                    : notificationLoading
                    ? "Checking..."
                    : notificationEnabled
                    ? "Notifications On"
                    : "Enable Notifications"}
                </button>

                {/* REFRESH */}
                <button
                  type="button"
                  onClick={() =>
                    void loadPortal(false)
                  }
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E3E6DE] bg-white px-3.5 py-2 text-xs font-medium text-[#40543E] transition hover:bg-[#F2F4EC] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      refreshing
                        ? "animate-spin"
                        : ""
                    }`}
                  />

                  Refresh
                </button>
              </div>
            </div>

            {/* NOTIFICATION MESSAGE */}
            {notificationMessage && (
              <div className="border-t border-[#EEF0E9] px-5 py-2.5 sm:px-6">
                <div
                  className={`flex items-start gap-1.5 text-xs font-medium ${
                    notificationMessage
                      .toLowerCase()
                      .includes("unable")
                      ? "text-[#A2634B]"
                      : "text-[#55755A]"
                  }`}
                >
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                  <span>
                    {notificationMessage}
                  </span>
                </div>
              </div>
            )}
          </header>

          {/* ERROR */}
          {error ? (
            <div className="rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] p-4">
              <p className="text-xs font-medium text-[#8A624D]">
                Unable to load portal
              </p>

              <p className="mt-1 text-xs text-[#A17255]">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadPortal(true)
                }
                className="mt-3.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#295640]"
              >
                Try Again
              </button>
            </div>
          ) : tasks.length === 0 ? (
            /* EMPTY */
            <div className="rounded-xl border border-dashed border-[#DFE4DA] bg-white p-10 text-center shadow-sm">
              <CheckCircle2 className="mx-auto h-8 w-8 text-[#356248]" />

              <h2 className="mt-3 text-xs font-medium text-[#294436]">
                No tasks assigned
              </h2>

              <p className="mt-0.5 text-xs text-[#859083]">
                New tasks will appear here when
                they are assigned to you.
              </p>
            </div>
          ) : (
            /* TASKS */
            <div className="space-y-3">
              {tasks.map((task) => {
                const working =
                  workingTaskId ===
                  task.taskId;

                const canAccept =
                  task.status ===
                  "Open";

                const canComplete =
                  task.status ===
                  "InProgress";

                return (
                  <div
                    key={task.taskId}
                    className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm transition hover:border-[#C7D3C7] hover:shadow sm:p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                      {/* TASK INFO */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {task.department && (
                            <span className="rounded-md bg-[#EDF1F3] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-[#5C7180]">
                              {task.department}
                            </span>
                          )}

                          <span
                            className={`rounded-md px-2 py-0.5 text-[9px] font-medium ${statusClass(
                              task.status
                            )}`}
                          >
                            {statusLabel(
                              task.status
                            )}
                          </span>
                        </div>

                        <h2 className="mt-2 text-xs font-medium text-[#294436]">
                          {task.title}
                        </h2>

                        {task.description && (
                          <p className="mt-1 max-w-2xl text-[11px] leading-4 text-[#859083]">
                            {task.description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#8C9782]">
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3 w-3" />
                            Created{" "}
                            {formatDate(
                              task.createdAt
                            )}
                          </span>

                          {task.dueAt && (
                            <span>
                              Due{" "}
                              {formatDate(
                                task.dueAt
                              )}
                            </span>
                          )}

                          {task.assignedStaffName && (
                            <span>
                              Assigned to{" "}
                              {task.assignedStaffName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {canAccept && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleAcceptTask(
                                task
                              )
                            }
                            disabled={working}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#5C7180] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-[#4C5E6A] disabled:opacity-60"
                          >
                            {working && (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            )}

                            Accept
                          </button>
                        )}

                        {canComplete && (
                          <button
                            type="button"
                            onClick={() =>
                              openCompletionModal(
                                task
                              )
                            }
                            disabled={working}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#356248] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-[#295640] disabled:opacity-60"
                          >
                            <Camera className="h-3.5 w-3.5" />

                            Complete
                          </button>
                        )}

                        {task.actionToken && (
                          <button
                            type="button"
                            onClick={() =>
                              openTaskLink(
                                task.actionToken
                              )
                            }
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E3E6DE] bg-white px-3.5 py-2 text-xs font-medium text-[#40543E] transition hover:bg-[#F2F4EC]"
                          >
                            Open Task
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* FOOTER */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-[#8C9782]">
            <LogOut className="h-3 w-3" />

            This portal is link-based; no staff password is required.
          </div>
        </div>
      </div>

      {/* =====================================================
          COMPLETE TASK + PROOF PHOTO MODAL
      ===================================================== */}

      {completionTask && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-[#EEF0E9] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8EFE8] text-[#356248]">
                  <Camera className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="text-sm font-medium text-[#294436]">
                    Complete Task
                  </h2>

                  <p className="mt-0.5 text-xs text-[#859083]">
                    {completionTask.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCompletionModal}
                disabled={
                  workingTaskId ===
                  completionTask.taskId
                }
                className="rounded-lg p-1.5 text-[#7D887D] hover:bg-[#F2F4EC] hover:text-[#294436] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="space-y-4 p-5 sm:p-6">

              <div className="rounded-lg border border-[#F7EEDC] bg-[#F7EEDC]/60 p-3.5">
                <p className="text-xs font-medium text-[#9B712F]">
                  Proof photo required
                </p>

                <p className="mt-0.5 text-[11px] leading-4 text-[#9B712F]/90">
                  Task complete karne ke liye work complete hone ki photo upload karna mandatory hai.
                </p>
              </div>

              {/* FILE INPUT */}
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                  Proof photo
                </label>

                <label className="mt-2 flex min-h-[160px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#DFE4DA] bg-[#F7F6F0]/50 transition hover:border-[#92AA92] hover:bg-[#E8EFE8]/40">

                  {proofPreview ? (
                    <div className="relative h-full min-h-[160px] w-full">
                      <img
                        src={proofPreview}
                        alt="Proof preview"
                        className="absolute inset-0 h-full w-full object-cover"
                      />

                      <div className="absolute inset-x-0 bottom-0 bg-slate-950/75 px-3 py-2">
                        <p className="truncate text-xs font-medium text-white">
                          {proofFile?.name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#7D887D] shadow-sm">
                        <ImageIcon className="h-5 w-5" />
                      </div>

                      <p className="mt-2.5 text-xs font-medium text-[#294436]">
                        Upload proof photo
                      </p>

                      <p className="mt-0.5 text-[10px] text-[#8C9782]">
                        JPG, PNG or WEBP • Max 5 MB
                      </p>
                    </>
                  )}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    onChange={
                      handleProofPhotoChange
                    }
                    disabled={
                      workingTaskId ===
                      completionTask.taskId
                    }
                    className="hidden"
                  />
                </label>

                {proofFile && (
                  <p className="mt-2 truncate text-[11px] text-[#859083]">
                    Selected: {proofFile.name}
                  </p>
                )}
              </div>

              {proofError && (
                <div className="rounded-lg border border-[#E7D4C7] bg-[#FBF0E9] p-3 text-xs text-[#8A624D]">
                  {proofError}
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex gap-2 border-t border-[#EEF0E9] pt-4">
                <button
                  type="button"
                  onClick={closeCompletionModal}
                  disabled={
                    workingTaskId ===
                    completionTask.taskId
                  }
                  className="flex-1 rounded-lg border border-[#E3E6DE] px-3.5 py-2 text-xs font-medium text-[#55755A] hover:bg-[#F2F4EC] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void submitTaskCompletion()
                  }
                  disabled={
                    !proofFile ||
                    workingTaskId ===
                      completionTask.taskId
                  }
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#356248] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {workingTaskId ===
                  completionTask.taskId ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Complete Task
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}