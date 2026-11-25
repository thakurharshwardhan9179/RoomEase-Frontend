import { Camera, ClipboardList, Eye, Loader2 } from "lucide-react";
import api from "../../../api/axios";
import { useState } from "react";

import type { TaskListItem } from "../../../api/tasks.api";
import ReportEmptyState from "../components/ReportEmptyState";
import type { TaskStats } from "../report.types";

function resolveProofPhotoUrl(url?: string | null) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  try {
    const base = api.defaults.baseURL || window.location.origin;
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

export default function OperationsReport({
  tasks,
  stats,
  loading,
}: {
  tasks: TaskListItem[];
  stats: TaskStats;
  loading: boolean;
}) {
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-4 border-b border-slate-100 p-5 sm:grid-cols-4 sm:p-6">
        <MiniStat label="Total" value={stats.total} />
        <MiniStat label="Open" value={stats.open} />
        <MiniStat label="In Progress" value={stats.inProgress} />
        <MiniStat label="Completed" value={stats.completed} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-sm font-semibold text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading operations report…
        </div>
      ) : tasks.length === 0 ? (
        <ReportEmptyState label="No operations tasks found." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-5 py-4">Task</th>
                <th className="px-5 py-4">Department</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Assigned Staff</th>
                <th className="px-5 py-4">Proof</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => {
                const item = task as TaskListItem & {
                  proofPhotoUrl?: string | null;
                  ProofPhotoUrl?: string | null;
                };

                const proof =
                  item.proofPhotoUrl ??
                  item.ProofPhotoUrl ??
                  null;

                return (
                  <tr
                    key={task.taskId}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="mt-1 max-w-sm truncate text-xs text-slate-400">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs font-bold text-slate-600">
                      {task.department || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                          task.status === "Completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : task.status === "InProgress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {task.status === "InProgress"
                          ? "In Progress"
                          : task.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                      {task.assignedStaffName || "Not assigned"}
                    </td>

                    <td className="px-5 py-4">
                      {task.status === "Completed" && proof ? (
                        <button
                          type="button"
                          onClick={() =>
                            setProofUrl(
                              resolveProofPhotoUrl(proof)
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Proof
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">
                          {task.status === "Completed"
                            ? "No proof photo"
                            : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {proofUrl && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setProofUrl(null)}
            className="absolute inset-0"
            aria-label="Close proof viewer"
          />

          <div className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-extrabold text-slate-900">
                  Task Completion Proof
                </p>
              </div>

              <button
                type="button"
                onClick={() => setProofUrl(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <div className="bg-slate-950 p-4 sm:p-6">
              <img
                src={proofUrl}
                alt="Task completion proof"
                className="mx-auto max-h-[76vh] max-w-full rounded-2xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}
