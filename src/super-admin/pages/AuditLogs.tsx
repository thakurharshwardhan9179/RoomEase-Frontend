import { useEffect, useState } from "react";
import { saApi, saError } from "../api";

export default function AuditLogs() {
  const [ownerId, setOwner] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    saApi.audits({
      ownerId: ownerId || undefined,
      action: action || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      pageSize: 50,
    })
      .then(setItems)
      .catch((e) => setError(saError(e)));
  }, [ownerId, action, from, to, page]);

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 space-y-6">
        
        {/* PAGE HEADER */}
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
            Platform control
          </p>
          <h1 className="mt-1 text-xl font-medium tracking-tight text-[#294436] sm:text-2xl">
            Audit log
          </h1>
          <p className="mt-0.5 text-xs text-[#859083]">
            Track account changes, access overrides, and administrator actions.
          </p>
        </div>

        {/* FILTERS */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <input
            className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:ring-4 focus:ring-[#E3EADF]"
            placeholder="Filter by client owner ID"
            value={ownerId}
            onChange={(e) => {
              setPage(1);
              setOwner(e.target.value);
            }}
          />
          <input
            className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:ring-4 focus:ring-[#E3EADF]"
            placeholder="Action code"
            value={action}
            onChange={(e) => {
              setPage(1);
              setAction(e.target.value);
            }}
          />
          <label className="block text-xs font-medium text-[#304B35]">
            <span className="mb-1 block">From</span>
            <input
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:ring-4 focus:ring-[#E3EADF]"
              type="date"
              value={from}
              onChange={(e) => {
                setPage(1);
                setFrom(e.target.value);
              }}
            />
          </label>
          <label className="block text-xs font-medium text-[#304B35]">
            <span className="mb-1 block">To</span>
            <input
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:ring-4 focus:ring-[#E3EADF]"
              type="date"
              value={to}
              onChange={(e) => {
                setPage(1);
                setTo(e.target.value);
              }}
            />
          </label>
        </div>

        {error && (
          <div className="rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] px-4 py-3 text-xs font-medium text-[#8A624D]">
            {error}
          </div>
        )}

        {/* TABLE CONTAINER */}
        <div className="overflow-hidden rounded-xl border border-[#E3E6DE] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-[#EEF0E9] bg-[#F7F6F0]/60 text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Administrator</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Change / reason</th>
                  <th className="px-4 py-3">IP address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF0E9]">
                {items.map((x) => (
                  <tr key={x.superAdminAuditLogId} className="text-xs transition-colors hover:bg-[#FAFBF7]">
                    <td className="px-4 py-3.5 text-[#7D8C75]">{new Date(x.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-md bg-[#E8EFE8] px-2 py-0.5 text-[9px] font-medium text-[#356248]">
                        {x.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8EFE8] text-xs font-medium text-[#356248]">
                          {x.clientName?.slice(0, 1).toUpperCase() || "?"}
                        </span>
                        <div>
                          <b className="font-medium text-[#294436]">{x.clientName || "—"}</b>
                          <small className="block text-[10px] text-[#8C9782] mt-0.5">{x.ownerId}</small>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[#36503E] font-medium">{x.superAdminName || "—"}</td>
                    <td className="px-4 py-3.5 text-[#40543E]">{x.entityType || "—"}</td>
                    <td className="px-4 py-3.5 max-w-[380px] truncate text-[#859083]">
                      <div>
                        {x.oldValue && <span>{x.oldValue} → </span>}
                        {x.newValue || x.reason || "—"}
                        {x.reason && x.newValue && (
                          <small className="block text-[10px] text-[#7D887D] mt-0.5">
                            Reason: {x.reason}
                          </small>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[#7D8C75]">{x.ipAddress || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {items.length === 0 && (
            <div className="py-12 text-center text-xs text-[#859083]">
              No audit records found for these filters.
            </div>
          )}

          {/* PAGINATION */}
          <div className="flex items-center justify-between border-t border-[#EEF0E9] px-4 py-3 text-xs text-[#859083]">
            <span>Page {page} · up to 50 records per page</span>
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-[#E3E6DE] bg-white px-3 py-1.5 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC] disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-[#E3E6DE] bg-white px-3 py-1.5 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC] disabled:opacity-40"
                disabled={items.length < 50}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}