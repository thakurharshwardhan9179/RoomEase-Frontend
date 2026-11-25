import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { saApi, saError } from "../api";

export default function Clients() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    saApi.plans().then(setPlans).catch(() => {});
  }, []);

  useEffect(() => {
    setError("");
    saApi.clients({
      search: search || undefined,
      subscriptionStatus: status || undefined,
      planCode: plan || undefined,
      page,
      pageSize: 20,
    })
      .then(setData)
      .catch((e) => setError(saError(e)));
  }, [search, status, plan, page]);

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 space-y-6">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
              Platform control
            </p>
            <h1 className="mt-1 text-xl font-medium tracking-tight text-[#294436] sm:text-2xl">
              Clients
            </h1>
            <p className="mt-0.5 text-xs text-[#859083]">
              Search accounts, review subscription status, and manage access.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-md border border-[#D5E2D5] bg-[#E8EFE8] px-3 py-1 text-xs font-medium text-[#356248]">
            {data?.totalCount ?? "—"} accounts
          </div>
        </div>

        {/* FILTERS */}
        <div className="grid gap-3 sm:grid-cols-[1fr_200px_180px]">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D887D]" />
            <input
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white pl-9 pr-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:ring-4 focus:ring-[#E3EADF]"
              placeholder="Search name or mobile number"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>

          <select
            className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:ring-4 focus:ring-[#E3EADF]"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All statuses</option>
            {["Active", "Trial", "Suspended", "Expired", "Cancelled", "NotConfigured"].map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>

          <select
            className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:ring-4 focus:ring-[#E3EADF]"
            value={plan}
            onChange={(e) => {
              setPage(1);
              setPlan(e.target.value);
            }}
          >
            <option value="">All plans</option>
            {plans.map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
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
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Properties</th>
                  <th className="px-4 py-3">Rooms</th>
                  <th className="px-4 py-3">Tenants</th>
                  <th className="px-4 py-3">Trial / Period ends</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF0E9]">
                {data?.items?.map((c: any) => (
                  <tr key={c.ownerId} className="text-xs transition-colors hover:bg-[#FAFBF7]">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8EFE8] text-xs font-medium text-[#356248]">
                          {c.fullName?.slice(0, 1).toUpperCase() || "?"}
                        </span>
                        <div>
                          <b className="font-medium text-[#294436]">{c.fullName}</b>
                          <small className="block text-[10px] text-[#8C9782] mt-0.5">
                            {c.mobileNumber}{c.isMobileVerified ? " · Verified" : ""}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[#36503E] font-medium">
                      {c.planName || c.planCode || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-medium ${
                          c.subscriptionStatus === "Suspended" || c.subscriptionStatus === "Expired"
                            ? "bg-[#FBF0E9] text-[#A2634B]"
                            : c.subscriptionStatus === "Trial"
                            ? "bg-[#F7EEDC] text-[#9B712F]"
                            : "bg-[#E8EFE8] text-[#356248]"
                        }`}
                      >
                        {c.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#40543E]">{c.propertyCount}</td>
                    <td className="px-4 py-3.5 text-[#40543E]">{c.roomCount}</td>
                    <td className="px-4 py-3.5 text-[#40543E]">{c.tenantCount}</td>
                    <td className="px-4 py-3.5 text-[#7D8C75]">
                      {(c.trialEndsAt || c.currentPeriodEnd)
                        ? new Date(c.trialEndsAt || c.currentPeriodEnd).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        className="text-xs font-medium text-[#356248] hover:text-[#1D4435] transition"
                        to={`/super-admin/clients/${c.ownerId}`}
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!data && (
            <div className="py-12 text-center text-xs text-[#7D887D]">
              Loading clients…
            </div>
          )}
          {data?.items?.length === 0 && (
            <div className="py-12 text-center text-xs text-[#859083]">
              No client accounts match these filters.
            </div>
          )}

          {/* PAGINATION */}
          <div className="flex items-center justify-between border-t border-[#EEF0E9] px-4 py-3 text-xs text-[#859083]">
            <span>
              Showing {data?.items?.length || 0} of {data?.totalCount || 0} clients
            </span>
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-[#E3E6DE] bg-white px-3 py-1.5 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC] disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="min-w-16 text-center text-xs font-medium text-[#7D887D]">
                {data?.page || page} / {data?.totalPages || 1}
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-[#E3E6DE] bg-white px-3 py-1.5 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC] disabled:opacity-40"
                disabled={page >= (data?.totalPages || 1)}
                onClick={() => setPage(page + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}