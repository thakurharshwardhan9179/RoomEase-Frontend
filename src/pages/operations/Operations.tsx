import {
   useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getProperties,
  getProperty,
  type Property,
  type PropertyDetail,
} from "../../api/properties.api";

import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Copy,
  ExternalLink,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  UserRound,
  X,
} from "lucide-react";

import {
  assignTask,
  createTask,
  getMyTasks,
  updateTaskStatus,
  type TaskDepartment,
  type TaskListItem,
  type TaskStatus,
} from "../../api/tasks.api";

import {
  getMyStaff,
  type Staff,
} from "../../api/staff.api";

const departments: Array<"All" | TaskDepartment> = [
  "All",
  "Housekeeping",
  "Maintenance",
  "IT",
  "FnB",
  "Other",
];

const statuses: Array<"All" | TaskStatus> = [
  "All",
  "Open",
  "InProgress",
  "Completed",
];

// Helper to resolve proof photo URL correctly from backend
const resolveImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    "https://localhost:7061";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
};

export default function Operations() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  const [department, setDepartment] =
    useState<"All" | TaskDepartment>("All");

  const [status, setStatus] =
    useState<"All" | TaskStatus>("All");

  const [loading, setLoading] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);

  const [assigningTask, setAssigningTask] =
    useState<TaskListItem | null>(null);

  const [updatingTaskId, setUpdatingTaskId] =
    useState<string | null>(null);

  // Lightbox state for viewing proof photo in full screen
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const taskResponse = await getMyTasks({
        department:
          department === "All"
            ? undefined
            : department,
        status:
          status === "All"
            ? undefined
            : status,
        page: 1,
        pageSize: 50,
      });

      const taskItems = Array.isArray(taskResponse)
        ? taskResponse
        : taskResponse.items || [];

      setTasks(taskItems);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to load operations tasks."
      );
    } finally {
      setLoading(false);
    }
  }, [department, status]);

  const loadStaff = useCallback(async () => {
    try {
      setLoadingStaff(true);

      const response = await getMyStaff({
        isActive: true,
        page: 1,
        pageSize: 100,
      });

      setStaff(response.items || []);
    } catch {
      setStaff([]);
    } finally {
      setLoadingStaff(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const stats = useMemo(() => {
    const open = tasks.filter(
      (task) => task.status === "Open"
    ).length;

    const inProgress = tasks.filter(
      (task) => task.status === "InProgress"
    ).length;

    const completed = tasks.filter(
      (task) => task.status === "Completed"
    ).length;

    return {
      total: tasks.length,
      open,
      inProgress,
      completed,
    };
  }, [tasks]);

  const handleAssign = async (
    taskId: string,
    staffId: string
  ) => {
    try {
      setUpdatingTaskId(taskId);

      await assignTask(taskId, staffId);

      await loadData();
      await loadStaff();

      setAssigningTask(null);
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          "Unable to assign this task."
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleStatusChange = async (
    task: TaskListItem,
    nextStatus: TaskStatus
  ) => {
    if (task.status === nextStatus) {
      return;
    }

    try {
      setUpdatingTaskId(task.taskId);

      await updateTaskStatus(
        task.taskId,
        nextStatus
      );

      await loadData();
      await loadStaff();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          "Unable to update task status."
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const getStaffLink = (
    actionToken?: string
  ) => {
    if (!actionToken) {
      return null;
    }

    return `${window.location.origin}/staff/${actionToken}`;
  };

  const copyMagicLink = async (
    actionToken?: string
  ) => {
    const link = getStaffLink(actionToken);

    if (!link) {
      alert(
        "Staff link is not available because actionToken was not returned by the backend."
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(link);

      alert(
        "Staff task link copied successfully."
      );
    } catch {
      window.prompt(
        "Copy this staff task link:",
        link
      );
    }
  };

  const shareMagicLink = (
    actionToken?: string
  ) => {
    const link = getStaffLink(actionToken);

    if (!link) {
      alert(
        "Staff link is not available because actionToken was not returned by the backend."
      );
      return;
    }

    const message = encodeURIComponent(
      `RoomEase Task\n\nPlease open this link to manage your assigned task:\n\n${link}`
    );

    window.open(
      `https://wa.me/?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-[#55755A]" />

              <span className="text-xs font-medium text-[#7D887D]">
                Operations
              </span>
            </div>

            <h1 className="mt-1 text-xl font-medium tracking-tight text-[#294436] sm:text-2xl">
              Task Center
            </h1>

            <p className="mt-0.5 text-xs text-[#859083]">
              Manage housekeeping, maintenance, IT and F&B tasks.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E3E6DE] bg-white px-3.5 py-2 text-xs font-medium text-[#40543E] shadow-sm hover:bg-[#F2F4EC] disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#295640]"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Task
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total"
            value={stats.total}
            icon={
              <ClipboardList className="h-4 w-4" />
            }
          />

          <StatCard
            title="Open"
            value={stats.open}
            icon={
              <Clock3 className="h-4 w-4" />
            }
          />

          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={
              <Loader2 className="h-4 w-4" />
            }
          />

          <StatCard
            title="Completed"
            value={stats.completed}
            icon={
              <CheckCircle2 className="h-4 w-4" />
            }
          />
        </div>

        {/* FILTERS */}
        <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[#55755A]" />

            <span className="text-xs font-medium text-[#294436]">
              Filters
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                Department
              </p>

              <div className="flex flex-wrap gap-2">
                {departments.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setDepartment(item)
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      department === item
                        ? "bg-[#1D4435] text-white shadow-sm"
                        : "border border-[#E3E6DE] bg-white text-[#40543E] hover:bg-[#F2F4EC]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                Status
              </p>

              <div className="flex flex-wrap gap-2">
                {statuses.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setStatus(item)
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      status === item
                        ? "bg-[#1D4435] text-white shadow-sm"
                        : "border border-[#E3E6DE] bg-white text-[#40543E] hover:bg-[#F2F4EC]"
                    }`}
                  >
                    {item === "InProgress"
                      ? "In Progress"
                      : item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-[#8A624D]">
                {error}
              </p>

              <button
                type="button"
                onClick={loadData}
                className="rounded-lg bg-[#1D4435] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#295640]"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* TASK LIST CONTAINER */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-medium text-[#294436]">
              Tasks List ({tasks.length})
            </h2>
            <p className="text-[10px] text-[#859083]">Owner-side operational task management</p>
          </div>

          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-xl bg-white border border-[#E3E6DE] shadow-sm"
                />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#DFE4DA] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
                <ClipboardList className="h-5 w-5" />
              </div>

              <h3 className="mt-3 text-xs font-medium text-[#294436]">
                No tasks found
              </h3>

              <p className="mt-0.5 text-xs text-[#859083]">
                Create a task or change your filters.
              </p>

              <button
                type="button"
                onClick={() =>
                  setShowCreate(true)
                }
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#295640]"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Task
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tasks.map((task) => (
                <TaskCardBox
                  key={task.taskId}
                  task={task}
                  updating={
                    updatingTaskId ===
                    task.taskId
                  }
                  onAssign={() =>
                    setAssigningTask(task)
                  }
                  onStatusChange={(nextStatus) =>
                    handleStatusChange(
                      task,
                      nextStatus
                    )
                  }
                  onCopyLink={() =>
                    copyMagicLink(
                      task.actionToken
                    )
                  }
                  onShareLink={() =>
                    shareMagicLink(
                      task.actionToken
                    )
                  }
                  onViewProof={(proofUrl) =>
                    setPreviewImageUrl(resolveImageUrl(proofUrl))
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* LIGHTBOX / FULL SCREEN IMAGE PREVIEW MODAL */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-xl bg-white p-2 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 text-[#294436] border-b border-[#EEF0E9]">
              <span className="text-xs font-medium">Task Completion Proof</span>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="rounded-lg p-1 text-[#7D887D] hover:bg-[#F2F4EC] hover:text-[#294436] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3">
              <img
                src={previewImageUrl}
                alt="Task Completion Proof Full"
                className="max-h-[72vh] w-auto mx-auto rounded-lg object-contain shadow-sm"
              />
            </div>
            <div className="flex justify-end p-2 border-t border-[#EEF0E9]">
              <a
                href={previewImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#295640] transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Original
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {assigningTask && (
        <AssignStaffModal
          task={assigningTask}
          staff={staff}
          loading={loadingStaff}
          saving={
            updatingTaskId ===
            assigningTask.taskId
          }
          onClose={() =>
            setAssigningTask(null)
          }
          onAssign={(staffId) =>
            handleAssign(
              assigningTask.taskId,
              staffId
            )
          }
        />
      )}

      {/* CREATE TASK MODAL */}
      {showCreate && (
        <CreateTaskModal
          staff={staff}
          onClose={() =>
            setShowCreate(false)
          }
          onCreated={async () => {
            setShowCreate(false);
            await loadData();
            await loadStaff();
          }}
        />
      )}
    </div>
  );
}

/* =========================================================
   INDIVIDUAL TASK CARD BOX (PROPERLY ARRANGED & ORGANIZED)
========================================================= */

function TaskCardBox({
  task,
  updating,
  onAssign,
  onStatusChange,
  onCopyLink,
  onShareLink,
  onViewProof,
}: {
  task: TaskListItem & { proofPhotoUrl?: string };
  updating: boolean;
  onAssign: () => void;
  onStatusChange: (
    status: TaskStatus
  ) => void;
  onCopyLink: () => void;
  onShareLink: () => void;
  onViewProof: (url: string) => void;
}) {
  return (
    <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm transition hover:border-[#C7D3C7] hover:shadow">
      <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
        
        {/* LEFT SIDE: DETAILS & BADGES */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <DepartmentBadge
              department={task.department}
            />

            <StatusBadge
              status={task.status}
            />

            {task.triggerType ===
              "AutoCheckout" && (
              <span className="rounded-md bg-[#EDF1F3] px-2 py-0.5 text-[9px] font-medium text-[#5C7180]">
                Auto Checkout
              </span>
            )}
          </div>

          <h3 className="text-xs font-medium text-[#294436]">
            {task.title}
          </h3>

          {task.description && (
            <p className="max-w-2xl text-[11px] leading-4 text-[#859083]">
              {task.description}
            </p>
          )}

          {/* COMPLETION PROOF PHOTO SECTION */}
          {task.proofPhotoUrl && (
            <div className="flex items-center gap-2.5 rounded-lg border border-[#D5E2D5] bg-[#E8EFE8]/50 p-2 max-w-xs">
              <div 
                className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-[#D5E2D5] bg-white shadow-sm cursor-pointer group" 
                onClick={() => onViewProof(task.proofPhotoUrl!)}
              >
                <img
                  src={resolveImageUrl(task.proofPhotoUrl)}
                  alt="Proof"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[9px] font-medium">
                  View
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium text-[#356248]">
                  Proof Attached
                </p>
                <button
                  type="button"
                  onClick={() => onViewProof(task.proofPhotoUrl!)}
                  className="text-[10px] text-[#356248] underline hover:text-[#1D4435]"
                >
                  Preview photo
                </button>
              </div>
            </div>
          )}

          {/* METADATA (DATE & ASSIGNED STAFF) */}
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#859083] pt-0.5">
            {task.createdAt && (
              <span>
                Created {formatDate(task.createdAt)}
              </span>
            )}

            <span className="inline-flex items-center gap-1 font-medium text-[#36503E]">
              <UserRound className="h-3 w-3 text-[#7D887D]" />
              {task.assignedStaffName || "Not assigned"}
            </span>
          </div>
        </div>

        {/* RIGHT SIDE: ACTION BUTTONS PROPERLY GROUPED */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#EEF0E9] lg:border-t-0 lg:pt-0 lg:justify-end">
          {/* ASSIGN */}
          <button
            type="button"
            onClick={onAssign}
            disabled={updating}
            className="inline-flex items-center gap-1 rounded-lg border border-[#E3E6DE] bg-[#F7F6F0]/60 px-2.5 py-1.5 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC] disabled:opacity-60 transition"
          >
            <UserRound className="h-3 w-3" />
            Assign
          </button>

          {/* START */}
          {task.status === "Open" && (
            <button
              type="button"
              disabled={updating}
              onClick={() =>
                onStatusChange(
                  "InProgress"
                )
              }
              className="rounded-lg bg-[#5C7180] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#4C5E6A] disabled:opacity-60 transition shadow-sm"
            >
              Start
            </button>
          )}

          {/* COMPLETE */}
          {task.status === "InProgress" && (
            <button
              type="button"
              disabled={updating}
              onClick={() =>
                onStatusChange(
                  "Completed"
                )
              }
              className="inline-flex items-center gap-1 rounded-lg bg-[#356248] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#295640] disabled:opacity-60 transition shadow-sm"
            >
              <CheckCircle2 className="h-3 w-3" />
              Complete
            </button>
          )}

          {/* STAFF LINK */}
          {task.actionToken && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#E3E6DE]">
              <button
                type="button"
                onClick={onCopyLink}
                disabled={updating}
                className="inline-flex items-center gap-1 rounded-lg border border-[#E3E6DE] bg-white px-2.5 py-1.5 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC] disabled:opacity-50 transition"
                title="Copy Staff Link"
              >
                <Copy className="h-3 w-3" />
                Copy Link
              </button>

              <button
                type="button"
                onClick={onShareLink}
                disabled={updating}
                className="inline-flex items-center gap-1 rounded-lg bg-[#356248] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#295640] disabled:opacity-50 transition shadow-sm"
                title="Share via WhatsApp"
              >
                WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ASSIGN STAFF MODAL
========================================================= */

function AssignStaffModal({
  task,
  staff,
  loading,
  saving,
  onClose,
  onAssign,
}: {
  task: TaskListItem;
  staff: Staff[];
  loading: boolean;
  saving: boolean;
  onClose: () => void;
  onAssign: (
    staffId: string
  ) => void;
}) {
  const matchingStaff = staff.filter(
    (member) =>
      member.propertyId === task.propertyId &&
      member.department ===
        task.department &&
      member.isActive
  );

  const freeStaff =
    matchingStaff.filter(
      (member) =>
        member.currentStatus ===
        "Free"
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#EEF0E9] px-5 py-4">
          <div>
            <h2 className="text-sm font-medium text-[#294436]">
              Assign Task
            </h2>

            <p className="mt-0.5 text-xs text-[#859083]">
              {task.title}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#7D887D] hover:bg-[#F2F4EC] hover:text-[#294436]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[#7D887D]" />
            </div>
          ) : matchingStaff.length ===
            0 ? (
            <div className="rounded-lg border border-[#F7EEDC] bg-[#F7EEDC]/60 p-4 text-center">
              <p className="text-xs font-medium text-[#9B712F]">
                No active staff found for{" "}
                {task.department}.
              </p>

              <p className="mt-1 text-[11px] text-[#9B712F]/80">
                Add a staff member in the
                Staff section first.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="mb-3 rounded-lg bg-[#F7F6F0]/60 p-3 border border-[#E3E6DE]">
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                  Department
                </p>

                <p className="mt-0.5 text-xs font-medium text-[#294436]">
                  {task.department}
                </p>

                <p className="mt-1 text-[11px] text-[#859083]">
                  Free staff:{" "}
                  <span className="font-medium text-[#356248]">
                    {freeStaff.length}
                  </span>
                </p>
              </div>

              {matchingStaff.map(
                (member) => (
                  <button
                    key={member.staffId}
                    type="button"
                    disabled={
                      saving ||
                      member.currentStatus !==
                        "Free"
                    }
                    onClick={() =>
                      onAssign(
                        member.staffId
                      )
                    }
                    className="flex w-full items-center justify-between rounded-lg border border-[#E3E6DE] p-3 text-left transition hover:border-[#C7D3C7] hover:bg-[#F7F6F0]/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
                        <UserRound className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-xs font-medium text-[#294436]">
                          {member.fullName}
                        </p>

                        <p className="text-[10px] text-[#859083]">
                          {member.role ||
                            member.department}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-md px-2 py-0.5 text-[9px] font-medium ${
                        member.currentStatus ===
                        "Free"
                          ? "bg-[#E8EFE8] text-[#356248]"
                          : "bg-[#F7EEDC] text-[#9B712F]"
                      }`}
                    >
                      {member.currentStatus}
                    </span>
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CREATE TASK MODAL
========================================================= */

function CreateTaskModal({
  staff,
  onClose,
  onCreated,
}: {
  staff: Staff[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [properties, setProperties] =
    useState<Property[]>([]);

  const [propertyDetail, setPropertyDetail] =
    useState<PropertyDetail | null>(
      null
    );

  const [propertyId, setPropertyId] =
    useState("");

  const [roomId, setRoomId] =
    useState("");

  const [bedId, setBedId] =
    useState("");

  const [department, setDepartment] =
    useState<TaskDepartment>(
      "Housekeeping"
    );

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [assignedStaffId, setAssignedStaffId] =
    useState("");

  const [loadingProperties, setLoadingProperties] =
    useState(true);

  const [loadingRooms, setLoadingRooms] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProperties = async () => {
      try {
        setLoadingProperties(true);

        const response =
          await getProperties({
            page: 1,
            pageSize: 100,
          });

        if (!mounted) return;

        setProperties(
          response.items || []
        );
      } catch {
        if (!mounted) return;

        setProperties([]);

        alert(
          "Unable to load properties."
        );
      } finally {
        if (mounted) {
          setLoadingProperties(false);
        }
      }
    };

    loadProperties();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!propertyId) {
      setPropertyDetail(null);
      setRoomId("");
      setBedId("");
      setLoadingRooms(false);
      return;
    }

    let mounted = true;

    const loadProperty = async () => {
      try {
        setLoadingRooms(true);

        setPropertyDetail(null);
        setRoomId("");
        setBedId("");

        const response = await getProperty(propertyId);

        if (!mounted) return;

        setPropertyDetail(response);
      } catch (err: any) {
        if (!mounted) return;

        setPropertyDetail(null);
        setRoomId("");
        setBedId("");

        alert(
          err?.response?.data?.message ||
            "Unable to load rooms for this property."
        );
      } finally {
        if (mounted) {
          setLoadingRooms(false);
        }
      }
    };

    loadProperty();

    return () => {
      mounted = false;
    };
  }, [propertyId]);

  const selectedRoom =
    propertyDetail?.rooms?.find(
      (room) =>
        room.roomId === roomId
    );

  const beds =
    selectedRoom?.beds || [];

  const departmentStaff =
    staff.filter(
      (member) =>
        member.propertyId === propertyId &&
        member.isActive &&
        member.department ===
          department &&
        member.currentStatus ===
          "Free"
    );

  useEffect(() => {
    if (!propertyId) {
      if (assignedStaffId) {
        setAssignedStaffId("");
      }
      return;
    }

    if (assignedStaffId) {
      const selectedStillValid = departmentStaff.some(
        (member) =>
          member.staffId === assignedStaffId
      );

      if (!selectedStillValid) {
        setAssignedStaffId(
          departmentStaff[0]?.staffId || ""
        );
      }

      return;
    }

    if (departmentStaff.length > 0) {
      setAssignedStaffId(
        departmentStaff[0].staffId
      );
    }
  }, [
    propertyId,
    department,
    staff,
    assignedStaffId,
  ]);

  const submit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!propertyId) {
      alert(
        "Please select a property."
      );
      return;
    }

    if (!title.trim()) {
      alert(
        "Task title is required."
      );
      return;
    }

    try {
      setSaving(true);

      await createTask({
        propertyId,
        department,
        roomId:
          roomId || undefined,
        bedId:
          bedId || undefined,
        title:
          title.trim(),
        description:
          description.trim() ||
          undefined,
        assignedStaffId:
          assignedStaffId ||
          undefined,
      });

      await onCreated();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          "Unable to create task."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#EEF0E9] px-5 py-4">
          <div>
            <h2 className="text-sm font-medium text-[#294436]">
              Create Task
            </h2>

            <p className="mt-0.5 text-xs text-[#859083]">
              Create a manual operational task.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#7D887D] hover:bg-[#F2F4EC] hover:text-[#294436]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#304B35]">
              Property
            </label>

            <select
              value={propertyId}
              onChange={(event) => {
                setPropertyId(
                  event.target.value
                );
                setRoomId("");
                setBedId("");
                setAssignedStaffId("");
              }}
              disabled={
                loadingProperties
              }
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none focus:border-[#92AA92] disabled:bg-[#F7F6F0]"
            >
              <option value="">
                {loadingProperties
                  ? "Loading properties..."
                  : "Select property"}
              </option>

              {properties.map(
                (property) => (
                  <option
                    key={
                      property.propertyId
                    }
                    value={
                      property.propertyId
                    }
                  >
                    {property.propertyName}
                    {" — "}
                    {property.city}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#304B35]">
              Room
            </label>

            <select
              value={roomId}
              onChange={(event) => {
                setRoomId(
                  event.target.value
                );
                setBedId("");
              }}
              disabled={
                !propertyId ||
                loadingRooms
              }
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none focus:border-[#92AA92] disabled:bg-[#F7F6F0]"
            >
              <option value="">
                {!roomId
                  ? "Select room first"
                  : propertyDetail?.rooms
                      ?.length
                  ? "Select room (optional)"
                  : "No rooms found"}
              </option>

              {propertyDetail?.rooms?.map(
                (room) => (
                  <option
                    key={room.roomId}
                    value={room.roomId}
                  >
                    Room{" "}
                    {room.roomNumber}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#304B35]">
              Bed
            </label>

            <select
              value={bedId}
              onChange={(event) =>
                setBedId(
                  event.target.value
                )
              }
              disabled={
                !roomId ||
                !selectedRoom
              }
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none focus:border-[#92AA92] disabled:bg-[#F7F6F0]"
            >
              <option value="">
                {!roomId
                  ? "Select room first"
                  : beds.length > 0
                  ? "Select bed (optional)"
                  : "No beds found"}
              </option>

              {beds.map((bed) => (
                <option
                  key={bed.bedId}
                  value={bed.bedId}
                >
                  Bed{" "}
                  {bed.bedNumber}
                  {" — "}
                  {bed.status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#304B35]">
              Department
            </label>

            <select
              value={department}
              onChange={(event) => {
                setDepartment(
                  event.target.value as TaskDepartment
                );

                setAssignedStaffId("");
              }}
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none focus:border-[#92AA92]"
            >
              {departments
                .filter(
                  (item) =>
                    item !== "All"
                )
                .map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
            </select>
          </div>

          <Field
            label="Task Title"
            value={title}
            onChange={setTitle}
            placeholder="e.g. Clean Room 203"
          />

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#304B35]">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              rows={3}
              placeholder="Describe what needs to be done..."
              className="w-full resize-none rounded-lg border border-[#DFE4DA] px-3 py-2 text-xs outline-none focus:border-[#92AA92]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#304B35]">
              Assign Staff
            </label>

            <select
              value={assignedStaffId}
              onChange={(event) =>
                setAssignedStaffId(
                  event.target.value
                )
              }
              disabled={!propertyId || saving}
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none focus:border-[#92AA92] disabled:bg-[#F7F6F0]"
            >
              <option value="">
                {!propertyId
                  ? "Select property first"
                  : departmentStaff.length > 0
                  ? "Select staff"
                  : "No free staff available"}
              </option>

              {departmentStaff.map(
                (member) => (
                  <option
                    key={member.staffId}
                    value={member.staffId}
                  >
                    {member.fullName}
                    {" — "}
                    {member.currentStatus}
                  </option>
                )
              )}
            </select>

            {departmentStaff.length >
              0 && (
              <p className="mt-1.5 text-[10px] text-[#356248]">
                {assignedStaffId
                  ? "A free staff member is selected automatically. You can change it above."
                  : "Free staff found, but none is currently selected."}
              </p>
            )}

            {propertyId &&
              departmentStaff.length ===
                0 && (
              <p className="mt-1.5 text-[10px] text-[#859083]">
                No free staff available in this property for this department.
                The task will stay Open until a staff member is assigned.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2.5 border-t border-[#EEF0E9] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#E3E6DE] px-3.5 py-2 text-xs font-medium text-[#55755A] hover:bg-[#F2F4EC]"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              saving ||
              loadingProperties ||
              loadingRooms
            }
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#295640] disabled:opacity-60"
          >
            {saving && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}

            {saving
              ? "Creating..."
              : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[#304B35]">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-[#DFE4DA] px-3 text-xs font-medium text-[#36503E] outline-none focus:border-[#92AA92]"
      />
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
          {title}
        </span>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-medium tracking-tight text-[#294436]">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   DEPARTMENT BADGE
========================================================= */

function DepartmentBadge({
  department,
}: {
  department: string;
}) {
  return (
    <span className="rounded-md bg-[#EDF1F3] px-2 py-0.5 text-[9px] font-medium text-[#5C7180]">
      {department}
    </span>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

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
      className={`rounded-md px-2 py-0.5 text-[9px] font-medium ${classes}`}
    >
      {status === "InProgress"
        ? "In Progress"
        : status}
    </span>
  );
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
  value: string
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}