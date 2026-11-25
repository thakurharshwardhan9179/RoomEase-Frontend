import { useEffect, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import {
  acceptTaskViaToken,
  getTaskByActionToken,
  type PublicTask as PublicTaskType,
} from "../../api/tasks.api";
import { completePublicTaskByActionToken } from "../../api/staffPortal.api";
import { useNavigate } from "react-router-dom";

type State =
  | "loading"
  | "ready"
  | "accepting"
  | "completing"
  | "completed"
  | "error";

export default function PublicTask() {
  const [task, setTask] = useState<PublicTaskType | null>(null);
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const navigate = useNavigate();

  const parts = window.location.pathname
    .split("/")
    .filter(Boolean);

  const actionToken = parts[parts.length - 1];

  useEffect(() => {
    if (!actionToken) {
      setError("Invalid task link.");
      setState("error");
      return;
    }

    const loadTask = async () => {
      try {
        setState("loading");

        const data = await getTaskByActionToken(actionToken);

        setTask(data);
        setState("ready");
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            "Unable to load this task link."
        );

        setState("error");
      }
    };

    loadTask();
  }, [actionToken]);

  const handlePhotoSelect = (file: File) => {
    setPhotoError("");
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    const validExtensions = ["jpg", "jpeg", "png", "webp"];

    if (!validTypes.includes(file.type) && (!ext || !validExtensions.includes(ext))) {
      setPhotoError("Please select a valid image file (JPG, PNG, or WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Proof photo size must be 5 MB or less.");
      return;
    }

    setProofPhoto(file);
    const objectUrl = URL.createObjectURL(file);
    setProofPreview(objectUrl);
  };

  const handleRemovePhoto = () => {
    if (proofPreview) {
      URL.revokeObjectURL(proofPreview);
    }
    setProofPhoto(null);
    setProofPreview(null);
    setPhotoError("");
  };

  const handleAccept = async () => {
    try {
      setState("accepting");

      await acceptTaskViaToken(actionToken);

      setTask((current) =>
        current
          ? {
              ...current,
              status: "InProgress",
            }
          : current
      );

      setState("ready");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to accept this task."
      );

      setState("error");
    }
  };

  const handleComplete = async () => {
    if (state === "completing") return;

    if (!proofPhoto) {
      setPhotoError("A proof photo is required to complete this task.");
      return;
    }

    try {
      setState("completing");
      setPhotoError("");
      setError("");

      await completePublicTaskByActionToken(actionToken, proofPhoto);

      const staffPortalToken = sessionStorage.getItem(
        "roomease_current_staff_portal_token"
      );

      if (staffPortalToken) {
        navigate(`/staff/portal/${staffPortalToken}`, {
          replace: true,
        });
      } else {
        window.location.reload();
      }

      setTask((current) =>
        current
          ? {
              ...current,
              status: "Completed",
            }
          : current
      );

      setState("completed");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to complete this task."
      );

      setState("ready");
    }
  };

  if (state === "loading") {
    return (
      <Screen>
        <Loader2 className="h-6 w-6 animate-spin text-[#356248]" />

        <h1 className="mt-3 text-sm font-medium text-[#294436]">
          Loading task...
        </h1>

        <p className="mt-1 text-xs text-[#859083]">
          Please wait.
        </p>
      </Screen>
    );
  }

  if (state === "error") {
    return (
      <Screen>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FBF0E9] text-[#A2634B]">
          <Wrench className="h-5 w-5" />
        </div>

        <h1 className="mt-3 text-sm font-medium text-[#294436]">
          Task unavailable
        </h1>

        <p className="mt-1 text-center text-xs leading-5 text-[#859083]">
          {error}
        </p>
      </Screen>
    );
  }

  if (!task) return null;

  const completed = task.status === "Completed";
  const inProgress = task.status === "InProgress";

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased px-4 py-8">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-[#1D4435] text-white">
            <Sparkles className="h-5 w-5" />
          </div>

          <h1 className="mt-3 text-lg font-medium text-[#294436]">
            RoomEase Task
          </h1>

          <p className="mt-0.5 text-xs text-[#859083]">
            Staff action link
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#E3E6DE] bg-white shadow-sm">
          <div className="border-b border-[#EEF0E9] bg-[#F7F6F0]/60 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                  {task.department}
                </p>

                <h2 className="mt-0.5 text-sm font-medium text-[#294436]">
                  {task.title}
                </h2>
              </div>

              <StatusBadge status={task.status} />
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            <div className="rounded-lg border border-[#E3E6DE] bg-[#F7F6F0]/60 p-3.5">
              <p className="text-xs leading-5 text-[#36503E]">
                {task.description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoBox
                label="Property"
                value={task.propertyName}
                icon={<MapPin className="h-3.5 w-3.5 text-[#55755A]" />}
              />

              <InfoBox
                label="Location"
                value={
                  task.roomNumber
                    ? `Room ${task.roomNumber}${
                        task.bedNumber
                          ? ` • Bed ${task.bedNumber}`
                          : ""
                      }`
                    : "Not specified"
                }
                icon={<Clock3 className="h-3.5 w-3.5 text-[#55755A]" />}
              />
            </div>

            {task.assignedStaffName && (
              <div className="rounded-lg border border-[#E3E6DE] bg-white p-3.5">
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                  Assigned Staff
                </p>

                <p className="mt-0.5 text-xs font-medium text-[#294436]">
                  {task.assignedStaffName}
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-[#E7D4C7] bg-[#FBF0E9] p-3 text-xs font-medium text-[#8A624D]">
                {error}
              </div>
            )}

            {completed ? (
              <div className="rounded-xl border border-[#D5E2D5] bg-[#E8EFE8] p-4 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-[#356248]" />

                <h3 className="mt-2 text-xs font-medium text-[#356248]">
                  Task Completed
                </h3>

                <p className="mt-0.5 text-[11px] text-[#356248]/90">
                  The task has been marked completed successfully.
                </p>
              </div>
            ) : inProgress ? (
              <div className="space-y-3.5">
                {/* Proof Photo Upload Section */}
                <div className="rounded-xl border border-[#E3E6DE] bg-[#F7F6F0]/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-[#294436]">
                        Completion Proof Photo
                      </p>
                      <p className="text-[10px] text-[#859083]">
                        Required to complete • JPG, PNG or WEBP (Max 5 MB)
                      </p>
                    </div>
                  </div>

                  {proofPreview ? (
                    <div className="relative mt-3 overflow-hidden rounded-lg border border-[#E3E6DE] bg-white p-2">
                      <div className="relative h-40 w-full overflow-hidden rounded-md bg-[#F7F6F0]">
                        <img
                          src={proofPreview}
                          alt="Proof preview"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          disabled={state === "completing"}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/80 text-white transition hover:bg-slate-950 disabled:opacity-50"
                          title="Remove photo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-2 truncate px-1 text-[11px] text-[#859083]">
                        {proofPhoto?.name} ({(proofPhoto ? proofPhoto.size / (1024 * 1024) : 0).toFixed(2)} MB)
                      </p>
                    </div>
                  ) : (
                    <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#DFE4DA] bg-white p-4 text-center transition hover:border-[#92AA92] hover:bg-[#E8EFE8]/30">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoSelect(file);
                        }}
                        disabled={state === "completing"}
                      />
                      <Camera className="h-6 w-6 text-[#7D887D]" />
                      <span className="mt-2 text-xs font-medium text-[#294436]">
                        Take or select proof photo
                      </span>
                      <span className="mt-0.5 text-[10px] text-[#8C9782]">
                        Camera or gallery upload
                      </span>
                    </label>
                  )}

                  {photoError && (
                    <p className="mt-2 text-xs font-medium text-[#A2634B]">
                      {photoError}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={state === "completing"}
                  onClick={handleComplete}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#356248] px-4 py-3 text-xs font-medium text-white transition hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {state === "completing" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Completing task...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Task Complete
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={state === "accepting"}
                onClick={handleAccept}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-4 py-3 text-xs font-medium text-white transition hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state === "accepting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Accept Task
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-[10px] text-[#8C9782]">
          RoomEase Operations
        </p>
      </div>
    </div>
  );
}

function Screen({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F6F0] px-4 text-[#2C4136] antialiased">
      <div className="w-full max-w-sm rounded-xl border border-[#E3E6DE] bg-white p-6 text-center shadow-sm">
        {children}
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#E3E6DE] bg-white p-3 shadow-sm">
      <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
        {label}
      </p>

      <div className="mt-1.5 flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-medium text-[#294436]">
          {value}
        </span>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const classes =
    status === "Completed"
      ? "bg-[#E8EFE8] text-[#356248]"
      : status === "InProgress"
      ? "bg-[#EDF1F3] text-[#5C7180]"
      : "bg-[#F7EEDC] text-[#9B712F]";

  return (
    <span
      className={`rounded-md px-2.5 py-0.5 text-[9px] font-medium ${classes}`}
    >
      {status === "InProgress"
        ? "In Progress"
        : status}
    </span>
  );
}