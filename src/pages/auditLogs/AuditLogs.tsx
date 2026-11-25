import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  DoorOpen,
  Eye,
  FileText,
  Filter,
  Layers,
  Loader2,
  Lock,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  getAuditLogs,
  type AuditLog,
} from "../../api/auditLogs.api";
import { getApiErrorMessage } from "../../api/axios";

// ----------------------------------------------------
// Action Humanizer and Visual Styling
// ----------------------------------------------------

interface ActionMeta {
  label: string;
  badgeClass: string;
  icon: LucideIcon;
}

const ACTION_METAS: Record<string, ActionMeta> = {
  PropertyDeleted: {
    label: "Property deleted",
    badgeClass: "border-[#E7D4C7] bg-[#FBF0E9] text-[#A2634B]",
    icon: Trash2,
  },
  RoomDeleted: {
    label: "Room deleted",
    badgeClass: "border-[#E7D4C7] bg-[#FBF0E9] text-[#A2634B]",
    icon: DoorOpen,
  },
  BedDeleted: {
    label: "Bed deleted",
    badgeClass: "border-[#E7D4C7] bg-[#FBF0E9] text-[#A2634B]",
    icon: Trash2,
  },
  PaymentVoided: {
    label: "Payment voided",
    badgeClass: "border-[#F7EEDC] bg-[#F7EEDC]/60 text-[#9B712F]",
    icon: CreditCard,
  },
  StaffDeactivated: {
    label: "Staff deactivated",
    badgeClass: "border-[#E3E6DE] bg-[#F7F6F0] text-[#7D887D]",
    icon: UserX,
  },
  TenantSettled: {
    label: "Tenant settled",
    badgeClass: "border-[#D5E2D5] bg-[#E8EFE8] text-[#356248]",
    icon: UserCheck,
  },
};

function formatAction(action: string): ActionMeta {
  if (ACTION_METAS[action]) {
    return ACTION_METAS[action];
  }

  // Fallback for unknown action types: "SomeActionType" -> "Some action type"
  const humanized = action
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();

  const label =
    humanized.charAt(0).toUpperCase() + humanized.slice(1);

  return {
    label,
    badgeClass: "border-[#D5E2D5] bg-[#E8EFE8] text-[#356248]",
    icon: FileText,
  };
}

// ----------------------------------------------------
// Date Formatter
// ----------------------------------------------------

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatRelativeTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 30) return `${diffDay}d ago`;

  return formatDateTime(value);
}

// ----------------------------------------------------
// Main Component
// ----------------------------------------------------

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [entityFilter, setEntityFilter] = useState("All");

  // Detail Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Copy to clipboard helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 1800);
  };

  // Fetch from backend
  const fetchLogs = useCallback(
    async (currentPage = page, isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError("");

        const result = await getAuditLogs({
          page: currentPage,
          pageSize,
        });

        setLogs(result.items);
        setTotalCount(result.totalCount);
        setPage(result.page);
        setTotalPages(Math.max(1, result.totalPages));
      } catch (err) {
        setError(
          getApiErrorMessage(
            err,
            "Unable to load audit logs. Please try again.",
          ),
        );
        setLogs([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, pageSize],
  );

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  // Filters apply client-side to current page dataset (as backend supports page/pageSize only)
  const handleFilterChange = (
    type: "search" | "action" | "entity",
    value: string,
  ) => {
    if (type === "search") setSearch(value);
    if (type === "action") setActionFilter(value);
    if (type === "entity") setEntityFilter(value);
  };

  const handleClearFilters = () => {
    setSearch("");
    setActionFilter("All");
    setEntityFilter("All");
  };

  const isFiltered =
    search.trim() !== "" ||
    actionFilter !== "All" ||
    entityFilter !== "All";

  // Client-side filtering on the fetched page dataset
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== "All" && log.action !== actionFilter) {
        return false;
      }
      if (entityFilter !== "All" && log.entityType !== entityFilter) {
        return false;
      }
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesAction = log.action.toLowerCase().includes(query);
        const matchesEntity = (log.entityType || "").toLowerCase().includes(query);
        const matchesEntityId = (log.entityId || "").toLowerCase().includes(query);
        const matchesDetails = (log.details || "").toLowerCase().includes(query);
        if (
          !matchesAction &&
          !matchesEntity &&
          !matchesEntityId &&
          !matchesDetails
        ) {
          return false;
        }
      }
      return true;
    });
  }, [logs, actionFilter, entityFilter, search]);

  // Derive distinct options from logs for dynamic dropdowns
  const availableActions = useMemo(() => {
    const known = Object.keys(ACTION_METAS);
    const discovered = logs.map((l) => l.action);
    return Array.from(new Set([...known, ...discovered]));
  }, [logs]);

  const availableEntities = useMemo(() => {
    const standard = ["Property", "Room", "Bed", "Payment", "Staff", "Tenant"];
    const discovered = logs.map((l) => l.entityType).filter(Boolean);
    return Array.from(new Set([...standard, ...discovered]));
  }, [logs]);

  // Summary Metrics
  const distinctActionsInPage = useMemo(() => {
    return new Set(logs.map((l) => l.action)).size;
  }, [logs]);

  const latestEventTime = useMemo(() => {
    if (logs.length === 0) return "None";
    return formatRelativeTime(logs[0]?.createdAt);
  }, [logs]);

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased pb-16">
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 space-y-6">
        
        {/* =====================================================
            PAGE HEADER & READ-ONLY BADGE
        ===================================================== */}
        <div className="relative overflow-hidden rounded-xl bg-[#1D4435] p-5 text-white shadow-sm sm:p-6">
          <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-[9px] font-medium tracking-wide text-white uppercase">
                  <ShieldCheck className="h-3 w-3 text-[#A3C1AD]" />
                  System Records
                </span>

                <span className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-[9px] font-medium text-white">
                  <Lock className="h-3 w-3 text-[#A3C1AD]" />
                  Read-Only Audit Trail
                </span>
              </div>

              <h1 className="mt-2 text-xl font-medium tracking-tight text-white sm:text-2xl">
                Audit Logs
              </h1>

              <p className="mt-0.5 max-w-2xl text-xs leading-5 text-white/80">
                Immutable, chronological history of critical system events,
                voided transactions, room modifications, and operational settlements.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchLogs(page, true)}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  refreshing ? "animate-spin text-[#A3C1AD]" : ""
                }`}
              />
              {refreshing ? "Refreshing..." : "Refresh logs"}
            </button>
          </div>
        </div>

        {/* =====================================================
            KPI / SUMMARY AREA
        ===================================================== */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                Total Events
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8EFE8] text-[#356248]">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-medium tracking-tight text-[#294436]">
              {totalCount.toLocaleString("en-IN")}
            </p>
            <p className="mt-0.5 text-[10px] text-[#859083]">
              System-wide log records
            </p>
          </div>

          <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                Current Page
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EDF1F3] text-[#5C7180]">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-medium tracking-tight text-[#294436]">
              {page} <span className="text-xs font-normal text-[#859083]">/ {totalPages}</span>
            </p>
            <p className="mt-0.5 text-[10px] text-[#859083]">
              {pageSize} items per page
            </p>
          </div>

          <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                Action Types
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F7EEDC] text-[#9B712F]">
                <Filter className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-medium tracking-tight text-[#294436]">
              {distinctActionsInPage}
            </p>
            <p className="mt-0.5 text-[10px] text-[#859083]">
              Categories in current view
            </p>
          </div>

          <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                Latest Activity
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8EFE8] text-[#356248]">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 truncate text-xl font-medium tracking-tight text-[#294436]">
              {latestEventTime}
            </p>
            <p className="mt-0.5 text-[10px] text-[#859083]">
              Most recent event
            </p>
          </div>
        </div>

        {/* =====================================================
            FILTER & SEARCH BAR
        ================================================     */}
        <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7D887D]" />
              <input
                type="text"
                placeholder="Search action, entity ID or details..."
                value={search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 pl-9 pr-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
              />
            </div>

            {/* Action Type Dropdown */}
            <div className="relative">
              <select
                value={actionFilter}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:ring-4 focus:ring-[#E3EADF]"
              >
                <option value="All">All Action Types</option>
                {availableActions.map((action) => (
                  <option key={action} value={action}>
                    {formatAction(action).label} ({action})
                  </option>
                ))}
              </select>
            </div>

            {/* Entity Type Dropdown */}
            <div className="relative">
              <select
                value={entityFilter}
                onChange={(e) => handleFilterChange("entity", e.target.value)}
                className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:ring-4 focus:ring-[#E3EADF]"
              >
                <option value="All">All Entities</option>
                {availableEntities.map((entity) => (
                  <option key={entity} value={entity}>
                    {entity}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters CTA */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#E3E6DE] bg-[#F2F4EC] px-3.5 text-xs font-medium text-[#40543E] transition hover:bg-[#E3E6DE]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Client-side filter disclosure */}
          {isFiltered && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#EEF0E9] pt-3 text-[11px] text-[#859083]">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#294436]">
                  Showing {filteredLogs.length} of {logs.length} records on this page
                </span>
                <span className="rounded bg-[#F7EEDC] px-2 py-0.5 text-[9px] font-medium text-[#9B712F] border border-[#F7EEDC]">
                  Page-level Filter
                </span>
              </div>
              <span className="text-[#8C9782]">
                Current backend supports pagination only. Filters apply to loaded page.
              </span>
            </div>
          )}
        </div>

        {/* =====================================================
            MAIN CONTENT: TABLE & CARDS
        ===================================================== */}
        {error ? (
          <div className="rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] p-6 text-center shadow-sm">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-[#F7EEDC] text-[#A2634B]">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-xs font-medium text-[#8A624D]">
              Failed to load audit logs
            </h3>
            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#A17255]">
              {error}
            </p>
            <button
              type="button"
              onClick={() => fetchLogs(page)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#295640]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        ) : loading && !refreshing ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-[#E3E6DE] bg-white p-10 text-center shadow-sm">
            <Loader2 className="h-7 w-7 animate-spin text-[#7D887D]" />
            <p className="mt-3 text-xs font-medium text-[#294436]">
              Loading audit logs...
            </p>
            <p className="mt-0.5 text-[11px] text-[#859083]">
              Fetching records from the server
            </p>
          </div>
        ) : logs.length === 0 || filteredLogs.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-[#DFE4DA] bg-white p-10 text-center shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-xs font-medium text-[#294436]">
              {isFiltered ? "No matching audit logs found" : "No audit logs recorded yet"}
            </h3>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#859083]">
              {isFiltered
                ? "Try adjusting your search keyword or clearing active action and entity filters."
                : "Operational events such as bed deletions, tenant settlements, and voided payments will appear here."}
            </p>
            {isFiltered && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#295640]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#E3E6DE] bg-white shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EEF0E9] bg-[#F7F6F0]/60 text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                    <th className="py-3 pl-4 pr-3">Action</th>
                    <th className="py-3 px-3">Entity</th>
                    <th className="py-3 px-3">Entity ID</th>
                    <th className="py-3 px-3">Details</th>
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 pl-3 pr-4 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF0E9] text-xs">
                  {filteredLogs.map((log) => {
                    const meta = formatAction(log.action);
                    const ActionIcon = meta.icon;

                    return (
                      <tr
                        key={log.auditLogId}
                        className="group transition-colors hover:bg-[#FAFBF7]"
                      >
                        {/* Action Badge */}
                        <td className="py-3.5 pl-4 pr-3 align-top">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
                              <ActionIcon className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <span
                                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-medium ${meta.badgeClass}`}
                              >
                                {meta.label}
                              </span>
                              <p className="mt-0.5 font-mono text-[9px] text-[#8C9782]">
                                {log.action}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Entity Type */}
                        <td className="py-3.5 px-3 align-top font-medium text-[#294436]">
                          <span className="inline-flex items-center rounded-md bg-[#EDF1F3] px-2 py-0.5 text-[9px] font-medium text-[#5C7180]">
                            {log.entityType || "System"}
                          </span>
                        </td>

                        {/* Entity ID */}
                        <td className="py-3.5 px-3 align-top font-mono text-[11px] text-[#7D8C75]">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[120px]" title={log.entityId}>
                              {log.entityId || "—"}
                            </span>
                            {log.entityId && (
                              <button
                                type="button"
                                onClick={() => handleCopy(log.entityId, log.auditLogId)}
                                className="rounded p-1 text-[#7D887D] hover:bg-[#F2F4EC] hover:text-[#294436]"
                                title="Copy ID"
                              >
                                {copiedId === log.auditLogId ? (
                                  <Check className="h-3 w-3 text-[#356248]" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Details snippet */}
                        <td className="py-3.5 px-3 align-top text-[#859083]">
                          <p className="line-clamp-2 max-w-xs text-xs leading-4 text-[#859083]">
                            {log.details || <span className="text-[#8C9782] italic">No details recorded</span>}
                          </p>
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-3 align-top">
                          <p className="font-medium text-[#294436]">
                            {formatDateTime(log.createdAt)}
                          </p>
                          <p className="mt-0.5 text-[10px] text-[#8C9782]">
                            {formatRelativeTime(log.createdAt)}
                          </p>
                        </td>

                        {/* Expand Details Trigger */}
                        <td className="py-3.5 pl-3 pr-4 align-top text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#E3E6DE] bg-white px-2.5 py-1 text-xs font-medium text-[#40543E] shadow-sm transition hover:bg-[#F2F4EC]"
                          >
                            <Eye className="h-3 w-3" />
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="divide-y divide-[#EEF0E9] md:hidden">
              {filteredLogs.map((log) => {
                const meta = formatAction(log.action);
                const ActionIcon = meta.icon;

                return (
                  <div
                    key={log.auditLogId}
                    className="p-3.5 transition hover:bg-[#FAFBF7]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F2F4EC] text-[#55755A]">
                          <ActionIcon className="h-3 w-3" />
                        </div>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[9px] font-medium ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </div>

                      <span className="text-[10px] text-[#8C9782]">
                        {formatRelativeTime(log.createdAt)}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-[#294436]">
                          {log.entityType || "System"}:
                        </span>
                        <span className="font-mono text-[10px] text-[#7D8C75]">
                          {log.entityId ? `${log.entityId.slice(0, 8)}...` : "—"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#356248] hover:text-[#1D4435]"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                    </div>

                    {log.details && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#859083] bg-[#F7F6F0]/60 p-2.5 rounded-lg border border-[#E3E6DE]">
                        {log.details}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination Toolbar */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-[#EEF0E9] px-4 py-3 sm:flex-row text-xs text-[#859083]">
              <p>
                Showing{" "}
                <span className="font-medium text-[#294436]">
                  {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-[#294436]">
                  {Math.min(page * pageSize, totalCount)}
                </span>{" "}
                of <span className="font-medium text-[#294436]">{totalCount}</span> logs
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1 || loading}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E3E6DE] bg-white px-3 py-1.5 text-xs font-medium text-[#40543E] shadow-sm transition hover:bg-[#F2F4EC] disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>

                <span className="px-2.5 text-xs font-medium text-[#7D887D]">
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages || loading}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E3E6DE] bg-white px-3 py-1.5 text-xs font-medium text-[#40543E] shadow-sm transition hover:bg-[#F2F4EC] disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            EXPANDABLE DETAILS MODAL
        ================================================     */}
        {selectedLog && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedLog(null);
            }}
          >
            <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl border border-[#E3E6DE] animate-in fade-in zoom-in duration-150">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-[#EEF0E9] p-4 sm:p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[9px] font-medium ${
                        formatAction(selectedLog.action).badgeClass
                      }`}
                    >
                      {formatAction(selectedLog.action).label}
                    </span>
                    <span className="rounded-md bg-[#EDF1F3] px-2 py-0.5 text-[9px] font-medium text-[#5C7180]">
                      {selectedLog.entityType || "System"}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-[#294436]">
                    Audit Log Entry
                  </h3>
                  <p className="mt-0.5 text-[10px] text-[#859083]">
                    Record ID: {selectedLog.auditLogId}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="rounded-lg p-1.5 text-[#7D887D] hover:bg-[#F2F4EC] hover:text-[#294436]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-3.5 p-4 sm:p-5 text-xs">
                {/* Entity ID */}
                <div className="rounded-lg border border-[#E3E6DE] bg-[#F7F6F0]/60 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                      Entity ID
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedLog.entityId, "modal-entity")}
                      className="inline-flex items-center gap-1 font-medium text-[#356248] hover:text-[#1D4435]"
                    >
                      {copiedId === "modal-entity" ? (
                        <>
                          <Check className="h-3 w-3 text-[#356248]" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copy ID
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-1 font-mono text-[11px] font-medium text-[#294436] break-all">
                    {selectedLog.entityId || "—"}
                  </p>
                </div>

                {/* Timestamp Breakdown */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-lg border border-[#E3E6DE] bg-[#F7F6F0]/60 p-3">
                    <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                      Timestamp
                    </span>
                    <p className="mt-1 font-medium text-[#294436]">
                      {formatDateTime(selectedLog.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#E3E6DE] bg-[#F7F6F0]/60 p-3">
                    <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                      Relative Time
                    </span>
                    <p className="mt-1 font-medium text-[#294436]">
                      {formatRelativeTime(selectedLog.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Details Content */}
                <div>
                  <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                    Event Details & Payload
                  </span>
                  <div className="mt-1.5 max-h-44 overflow-y-auto rounded-lg border border-[#E3E6DE] bg-[#1D4435] p-3.5 font-mono text-[11px] leading-relaxed text-white [scrollbar-width:thin]">
                    {selectedLog.details ? (
                      <pre className="whitespace-pre-wrap break-all font-mono">
                        {selectedLog.details}
                      </pre>
                    ) : (
                      <span className="text-[#A3C1AD] italic">No additional event details provided.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end border-t border-[#EEF0E9] bg-[#F7F6F0]/60 p-4">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="rounded-lg bg-[#1D4435] px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#295640]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}