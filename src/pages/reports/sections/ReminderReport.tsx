
import { AlertTriangle, ChevronRight, Clock3, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { Property } from "../../../api/properties.api";
import type { ReminderLog } from "../../../api/reminder.api";
import ReportEmptyState from "../components/ReportEmptyState";
import type { ReminderStats } from "../report.types";

export default function ReminderReport({
  properties,
  propertyId,
  reminders,
  page,
  total,
  stats,
  loading,
  setPropertyId,
  setPage,
}: {
  properties: Property[];
  propertyId: string;
  reminders: ReminderLog[];
  page: number;
  total: number;
  stats: ReminderStats;
  loading: boolean;
  setPropertyId: (value: string) => void;
  setPage: (value: number) => void;
}) {
  const navigate = useNavigate();

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-rose-600" />
            <h2 className="text-lg font-extrabold text-slate-900">
              Reminder History
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Stored overdue and due-soon reminder checks.
          </p>
        </div>

        <select
          value={propertyId}
          onChange={(e) => {
            setPropertyId(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none"
        >
          <option value="">All properties</option>
          {properties.map((property) => (
            <option
              key={property.propertyId}
              value={property.propertyId}
            >
              {property.propertyName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 border-b border-slate-100 p-5 sm:grid-cols-3 sm:p-6">
        <Stat label="Total records" value={total} />
        <Stat label="Overdue on page" value={stats.overdue} tone="red" />
        <Stat label="Due Soon on page" value={stats.dueSoon} tone="amber" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-sm font-semibold text-slate-500">
          <Clock3 className="mr-2 h-4 w-4 animate-pulse" />
          Loading reminder history…
        </div>
      ) : reminders.length === 0 ? (
        <ReportEmptyState label="No reminder history yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-5 py-4">Tenant</th>
                <th className="px-5 py-4">Mobile</th>
                <th className="px-5 py-4">Balance</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Checked At</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reminders.map((item) => {
                const row = item as ReminderLog & {
                  tenantId?: string;
                };

                return (
                  <tr
                    key={item.reminderLogId}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-extrabold text-slate-900">
                        {item.tenantName}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.mobileNumber}
                    </td>
                    <td className="px-5 py-4 text-sm font-extrabold text-slate-900">
                      ₹{Number(item.balanceDue || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black ${
                          item.status === "Overdue"
                            ? "border-rose-100 bg-rose-50 text-rose-700"
                            : "border-amber-100 bg-amber-50 text-amber-700"
                        }`}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-500">
                      {new Date(item.checkedAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      {row.tenantId ? (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/tenants/${row.tenantId}`)
                          }
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          View Tenant
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">
                          —
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

      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
        <p className="text-xs font-semibold text-slate-500">
          Page {page}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={page === 1 || loading}
            onClick={() => setPage(Math.max(1, page - 1))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40"
          >
            Previous
          </button>

          <button
            type="button"
            disabled={loading || page * 10 >= total}
            onClick={() => setPage(page + 1)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
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
  tone?: "slate" | "red" | "amber";
}) {
  const classes =
    tone === "red"
      ? "border-rose-100 bg-rose-50 text-rose-700"
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
