import { UserRound } from "lucide-react";

import type { Staff } from "../../../api/staff.api";
import ReportEmptyState from "../components/ReportEmptyState";
import type { StaffStats } from "../report.types";

export default function StaffReport({
  staff,
  stats,
  loading,
}: {
  staff: Staff[];
  stats: StaffStats;
  loading: boolean;
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-4 border-b border-slate-100 p-5 sm:grid-cols-3 sm:p-6">
        <Stat label="Active staff" value={stats.total} />
        <Stat label="Free" value={stats.free} tone="green" />
        <Stat label="Busy / other" value={stats.busy} tone="amber" />
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm font-semibold text-slate-500">
          Loading staff report…
        </div>
      ) : staff.length === 0 ? (
        <ReportEmptyState label="No active staff found." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-5 py-4">Staff</th>
                <th className="px-5 py-4">Department</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((member) => (
                <tr
                  key={member.staffId}
                  className="hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-extrabold text-slate-900">
                        {member.fullName}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {member.department || "—"}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {member.role || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                        member.currentStatus === "Free"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {member.currentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "slate" | "green" | "amber";
}) {
  const classes =
    tone === "green"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : tone === "amber"
      ? "border-amber-100 bg-amber-50 text-amber-700"
      : "border-slate-200 bg-slate-50 text-slate-900";

  return (
    <div className={`rounded-2xl border p-4 ${classes}`}>
      <p className="text-[10px] font-black uppercase tracking-wider opacity-60">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

