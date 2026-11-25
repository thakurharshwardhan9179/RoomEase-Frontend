import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  IndianRupee,
  Loader2,
  LogOut,
  Pencil,
  Phone,
  RefreshCw,
  ShieldCheck,
  Upload,
  WalletCards,
  Trash2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  X,
} from "lucide-react";
import {
  getExpiringAgreements,
  getPendingSettlements,
  getTenants,
  settleRefund,
  type PendingSettlement,
  type Tenant,
  type TenantStatus,
} from "../../api/tenants.api";

const statusMeta: Record<
  TenantStatus,
  {
    label: string;
    classes: string;
    dot: string;
  }
> = {
  Paid: {
    label: "Paid",
    classes: "bg-[#E8EFE8] text-[#356248] border border-[#D5E2D5]",
    dot: "bg-[#356248]",
  },
  Upcoming: {
    label: "Upcoming",
    classes: "bg-[#EDF1F3] text-[#5C7180] border border-[#DFE4DA]",
    dot: "bg-[#5C7180]",
  },
  DueSoon: {
    label: "Due Soon",
    classes: "bg-[#F7EEDC] text-[#9B712F] border border-[#F7EEDC]",
    dot: "bg-[#9B712F]",
  },
  Overdue: {
    label: "Overdue",
    classes: "bg-[#FBF0E9] text-[#A2634B] border border-[#E7D4C7]",
    dot: "bg-[#A2634B]",
  },
};

function formatMoney(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function getInitials(name?: string) {
  if (!name?.trim()) return "TN";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Tenants() {
  const navigate = useNavigate();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | TenantStatus
  >("All");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [expiring, setExpiring] = useState<Tenant[]>([]);
  const [pendingSettlements, setPendingSettlements] = useState<
    PendingSettlement[]
  >([]);

  const [pendingLoading, setPendingLoading] = useState(true);
  const [expiringLoading, setExpiringLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [settlementTarget, setSettlementTarget] =
    useState<PendingSettlement | null>(null);

  const [settlementAmount, setSettlementAmount] = useState("");
  const [settlementNote, setSettlementNote] = useState("");
  const [settling, setSettling] = useState(false);

  const [showExpiring, setShowExpiring] = useState(false);
  const [error, setError] = useState("");

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTenants({
        search: searchQuery.trim() || undefined,
        status:
          statusFilter === "All"
            ? undefined
            : statusFilter,
        page,
        pageSize,
      });

      setTenants(data.items);
      setTotalPages(Math.max(1, data.totalPages));
      setTotalCount(data.totalCount);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Unable to load tenants."
      );

      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTenants();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery, statusFilter, page]);

  const loadPendingSettlements = async () => {
    try {
      setPendingLoading(true);

      const data = await getPendingSettlements();

      setPendingSettlements(data);
    } catch (err) {
      console.error(
        "Pending settlements load failed",
        err
      );
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    void loadPendingSettlements();
  }, []);

  useEffect(() => {
    if (!showExpiring) return;

    const load = async () => {
      try {
        setExpiringLoading(true);

        const data = await getExpiringAgreements(30);

        setExpiring(data);
      } catch (err) {
        console.error(err);
      } finally {
        setExpiringLoading(false);
      }
    };

    void load();
  }, [showExpiring]);

  const completeSettlement = async () => {
    if (!settlementTarget) return;

    const amount = Number(settlementAmount);

    if (!Number.isFinite(amount) || amount < 0) {
      setError(
        "Enter a valid actual settlement amount."
      );
      return;
    }

    try {
      setSettling(true);
      setError("");

      await settleRefund(
        settlementTarget.tenantId,
        {
          actualAmount: amount,
          note:
            settlementNote.trim() || undefined,
        }
      );

      setPendingSettlements((items) =>
        items.filter(
          (item) =>
            item.tenantId !==
            settlementTarget.tenantId
        )
      );

      setSettlementTarget(null);
      setSettlementAmount("");
      setSettlementNote("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to complete settlement."
      );
    } finally {
      setSettling(false);
    }
  };

  const visibleTenants = useMemo(
    () =>
      showExpiring
        ? expiring
        : tenants,
    [showExpiring, expiring, tenants]
  );

  const stats = useMemo(() => {
    const totalRent = tenants.reduce(
      (sum, tenant) =>
        sum + Number(tenant.totalRent || 0),
      0
    );

    const outstanding = tenants.reduce(
      (sum, tenant) =>
        sum + Number(tenant.balanceDue || 0),
      0
    );

    const advance = tenants.reduce(
      (sum, tenant) =>
        sum + Number(tenant.advanceBalance || 0),
      0
    );

    return {
      totalRent,
      outstanding,
      advance,
    };
  }, [tenants]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setPage(1);
    setShowExpiring(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      {/* HERO */}
      <div className="w-full px-4 pt-6 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-xl bg-[#1D4435] p-6 sm:p-8 text-white shadow-md">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-10 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-[#E8EFE8] mb-3">
                <Users className="h-3 w-3 text-[#A4B8A6]" />
                Resident Command Center
              </div>

              <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-white">
                Tenants & Resident Directory
              </h1>

              <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#C4D0C5]">
                Seamlessly manage resident profiles, room assignments, active rent statuses, agreements, and final settlements from a single hub.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowExpiring((value) => !value);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition shadow-sm ${
                  showExpiring
                    ? "border-white bg-white text-[#1D4435]"
                    : "border-white/20 bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <CalendarClock className="h-3.5 w-3.5" />
                {showExpiring
                  ? "Show all tenants"
                  : "Expiring in 30 days"}
              </button>

              <button
                type="button"
                onClick={() => void loadTenants()}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/20 shadow-sm"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
        {/* SUMMARY */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
              Residents
            </p>

            <p className="mt-2 text-2xl font-medium tracking-tight text-[#294436]">
              {showExpiring
                ? expiring.length
                : totalCount}
            </p>

            <p className="mt-1 text-[10px] text-[#859083]">
              {showExpiring
                ? "agreements expiring soon"
                : "active tenant records"}
            </p>
          </div>

          <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
              Monthly rent
            </p>

            <p className="mt-2 text-2xl font-medium tracking-tight text-[#294436]">
              {formatMoney(stats.totalRent)}
            </p>

            <p className="mt-1 text-[10px] text-[#859083]">
              across current results
            </p>
          </div>

          <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
              Outstanding
            </p>

            <p className="mt-2 text-2xl font-medium tracking-tight text-[#A2634B]">
              {formatMoney(stats.outstanding)}
            </p>

            <p className="mt-1 text-[10px] text-[#859083]">
              total balance due
            </p>
          </div>

          <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
              Advance credit
            </p>

            <p className="mt-2 text-2xl font-medium tracking-tight text-[#356248]">
              {formatMoney(stats.advance)}
            </p>

            <p className="mt-1 text-[10px] text-[#859083]">
              credit held for residents
            </p>
          </div>
        </section>

        {/* PENDING SETTLEMENTS */}
        <section className="rounded-xl border border-[#E3E6DE] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#EEF0E9] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F7EEDC] text-[#9B712F]">
                  <WalletCards className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="text-sm font-medium text-[#294436]">
                    Pending settlements
                  </h2>

                  <p className="mt-0.5 text-[11px] text-[#859083]">
                    Checked-out tenants whose final settlement is still pending.
                  </p>
                </div>
              </div>
            </div>

            <span className="inline-flex w-fit rounded-md bg-[#F7EEDC] px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider text-[#9B712F]">
              {pendingLoading
                ? "Loading..."
                : `${pendingSettlements.length} pending`}
            </span>
          </div>

          <div className="p-4 sm:p-5">
            {pendingLoading ? (
              <div className="flex min-h-[80px] items-center justify-center rounded-lg bg-[#F7F6F0]">
                <Loader2 className="h-4 w-4 animate-spin text-[#7D887D]" />
              </div>
            ) : pendingSettlements.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {pendingSettlements.map((item) => (
                  <div
                    key={item.tenantId}
                    className="rounded-xl border border-[#E3E6DE] bg-[#F7F6F0]/60 p-4 transition hover:border-[#C7D3C7] hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-[#294436]">
                          {item.fullName}
                        </p>

                        <p className="mt-0.5 text-[11px] text-[#859083]">
                          {item.mobileNumber}
                        </p>
                      </div>

                      <span className="rounded-md bg-[#F7EEDC] px-2 py-0.5 text-[9px] font-medium text-[#9B712F]">
                        Pending
                      </span>
                    </div>

                    <div className="mt-3.5 grid grid-cols-2 gap-3 border-t border-[#EEF0E9] pt-3.5">
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-wider text-[#7D887D]">
                          Checkout
                        </p>

                        <p className="mt-0.5 text-xs font-medium text-[#36503E]">
                          {formatDate(item.checkoutDate)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[9px] font-medium uppercase tracking-wider text-[#7D887D]">
                          Deposit
                        </p>

                        <p className="mt-0.5 text-xs font-medium text-[#294436]">
                          {formatMoney(item.depositAmount)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSettlementTarget(item);
                        setSettlementAmount("");
                        setSettlementNote("");
                      }}
                      className="mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-[#295640]"
                    >
                      Settle now
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-[#D5E2D5] bg-[#E8EFE8] p-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D5E2D5] text-[#356248]">
                  <CheckCircle2 className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-xs font-medium text-[#356248]">
                    No pending settlements
                  </p>

                  <p className="mt-0.5 text-[11px] text-[#356248]/80">
                    All checked-out tenant settlements are complete.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* FILTER BAR */}
        <section className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_100px]">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7D887D]" />

              <input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search tenant name or mobile number"
                className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 pl-9 pr-4 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value as
                    | "All"
                    | TenantStatus
                );
                setPage(1);
              }}
              className="h-10 rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
            >
              <option value="All">
                All rent statuses
              </option>
              <option value="Paid">Paid</option>
              <option value="Upcoming">Upcoming</option>
              <option value="DueSoon">Due Soon</option>
              <option value="Overdue">Overdue</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="h-10 rounded-lg border border-[#E3E6DE] bg-white px-3 text-xs font-medium text-[#40543E] transition hover:bg-[#F2F4EC]"
            >
              Reset
            </button>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] p-4 text-xs text-[#8A624D]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <div>
              <p className="font-medium">
                Could not load tenants
              </p>

              <p className="mt-0.5 text-[11px] text-[#A17255]">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* LIST HEADER */}
        {!loading && visibleTenants.length > 0 && (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                {showExpiring
                  ? "Expiring agreements"
                  : "Tenant directory"}
              </p>

              <h2 className="mt-0.5 text-base font-medium tracking-tight text-[#294436]">
                {showExpiring
                  ? "Agreements needing attention"
                  : "Current residents"}
              </h2>
            </div>

            <p className="text-xs text-[#859083]">
              {showExpiring
                ? `${expiring.length} resident(s)`
                : `${tenants.length} shown on this page`}
            </p>
          </div>
        )}

        {/* LOADING */}
        {(loading ||
          (showExpiring && expiringLoading)) ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-[320px] animate-pulse rounded-xl border border-[#E3E6DE] bg-white"
                />
              )
            )}
          </div>
        ) : visibleTenants.length === 0 ? (
          /* EMPTY */
          <div className="rounded-xl border border-dashed border-[#DFE4DA] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F2F4EC] text-[#55755A]">
              <Users className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-sm font-medium text-[#294436]">
              No tenants found
            </h2>

            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#859083]">
              No residents match the current search or
              rent-status filter.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-[#295640]"
            >
              Clear filters
            </button>
          </div>
        ) : (
          /* TENANT CARDS */
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleTenants.map((tenant) => {
              const meta =
                statusMeta[tenant.status] ??
                statusMeta.Upcoming;

              const rooms = tenant.rooms ?? [];

              return (
                <article
                  key={tenant.tenantId}
                  className="group overflow-hidden rounded-xl border border-[#E3E6DE] bg-white shadow-sm transition duration-200 hover:border-[#C7D3C7] hover:shadow"
                >
                  <div className="p-4 sm:p-5">
                    {/* TENANT HEADER */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1D4435] text-xs font-medium text-white shadow-sm">
                          {getInitials(
                            tenant.fullName
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-xs font-medium text-[#294436]">
                            {tenant.fullName}
                          </h3>

                          <a
                            href={`tel:${tenant.mobileNumber}`}
                            className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[#7D887D] transition hover:text-[#356248]"
                          >
                            <Phone className="h-3 w-3" />
                            {tenant.mobileNumber}
                          </a>
                        </div>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[9px] font-medium ring-1 ${meta.classes}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                        />

                        {meta.label}
                      </span>
                    </div>

                    {/* MONEY */}
                    <div className="mt-4 grid grid-cols-2 gap-2.5">
                      <div className="rounded-lg border border-[#E4E8DE] bg-[#F7F6F0]/60 p-3">
                        <p className="text-[9px] font-medium uppercase tracking-wider text-[#7D887D]">
                          Monthly rent
                        </p>

                        <p className="mt-0.5 text-sm font-medium text-[#294436]">
                          {formatMoney(
                            tenant.totalRent
                          )}
                        </p>
                      </div>

                      <div className="rounded-lg border border-[#E4E8DE] bg-[#F7F6F0]/60 p-3 text-right">
                        <p className="text-[9px] font-medium uppercase tracking-wider text-[#7D887D]">
                          Balance due
                        </p>

                        <p
                          className={`mt-0.5 text-sm font-medium ${
                            tenant.balanceDue > 0
                              ? "text-[#A2634B]"
                              : "text-[#356248]"
                          }`}
                        >
                          {formatMoney(
                            tenant.balanceDue
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#7D887D]">
                      <WalletCards className="h-3.5 w-3.5 text-[#859083]" />
                      Advance credit:
                      <span className="font-medium text-[#36503E]">
                        {formatMoney(
                          tenant.advanceBalance || 0
                        )}
                      </span>
                    </div>

                    {/* ROOM ASSIGNMENTS */}
                    <div className="mt-4">
                      <p className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                        Current assignment
                      </p>

                      {rooms.length ? (
                        <div className="space-y-1.5">
                          {rooms
                            .slice(0, 2)
                            .map((room) => (
                              <div
                                key={room.bedId}
                                className="flex items-center justify-between gap-3 rounded-lg border border-[#E3E6DE] bg-white px-3 py-2.5"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-medium text-[#294436]">
                                    {room.propertyName}
                                  </p>

                                  <p className="mt-0.5 text-[10px] text-[#859083]">
                                    Room{" "}
                                    {room.roomNumber}{" "}
                                    · Bed{" "}
                                    {room.bedNumber}
                                  </p>
                                </div>

                                <span className="shrink-0 text-xs font-medium text-[#36503E]">
                                  {formatMoney(
                                    room.agreedRent
                                  )}
                                </span>
                              </div>
                            ))}

                          {rooms.length > 2 && (
                            <p className="px-1 text-[10px] text-[#859083]">
                              +
                              {rooms.length -
                                2}{" "}
                              more assignment(s)
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-[#F7EEDC] bg-[#F7EEDC]/60 px-3 py-2 text-xs font-medium text-[#9B712F]">
                          No current room assignment
                        </div>
                      )}
                    </div>

                    {/* DATES */}
                    <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-[#EEF0E9] pt-4">
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-wider text-[#7D887D]">
                          Joining
                        </p>

                        <p className="mt-0.5 text-xs text-[#36503E]">
                          {formatDate(
                            tenant.joiningDate
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[9px] font-medium uppercase tracking-wider text-[#7D887D]">
                          Next due
                        </p>

                        <p className="mt-0.5 text-xs text-[#36503E]">
                          {formatDate(
                            tenant.nextDueDate
                          )}
                        </p>
                      </div>
                    </div>

                    {tenant.agreementEndDate && (
                      <div className="mt-2.5 flex items-center justify-between rounded-lg border border-[#E4E8DE] bg-[#F7F6F0]/60 px-3 py-2.5">
                        <span className="text-[10px] text-[#7D887D]">
                          Agreement ends
                        </span>

                        <span className="text-xs font-medium text-[#36503E]">
                          {formatDate(
                            tenant.agreementEndDate
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ACTION BAR */}
                  <div className="flex border-t border-[#EEF0E9] bg-[#F7F6F0]/60">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/tenants/${tenant.tenantId}`
                        )
                      }
                      className="flex flex-1 items-center justify-center gap-1.5 px-4 py-3 text-xs font-medium text-[#36503E] transition hover:bg-white hover:text-[#1D4435]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View profile
                    </button>

                    {tenant.whatsappLink ? (
                      <a
                        href={
                          tenant.whatsappLink
                        }
                        target="_blank"
                        rel="noreferrer"
                        title="Open WhatsApp"
                        className="flex items-center justify-center border-l border-[#EEF0E9] px-4 text-[#356248] transition hover:bg-[#E8EFE8]"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        {!showExpiring &&
          !loading &&
          totalPages > 1 && (
            <div className="flex flex-col gap-3 rounded-xl border border-[#E3E6DE] bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#859083]">
                Page{" "}
                <span className="font-medium text-[#294436]">
                  {page}
                </span>{" "}
                of{" "}
                <span className="font-medium text-[#294436]">
                  {totalPages}
                </span>
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(
                        1,
                        current - 1
                      )
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E3E6DE] px-3 py-1.5 text-xs font-medium text-[#40543E] transition hover:bg-[#F2F4EC] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    page === totalPages
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        totalPages,
                        current + 1
                      )
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E3E6DE] px-3 py-1.5 text-xs font-medium text-[#40543E] transition hover:bg-[#F2F4EC] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
      </main>

      {/* SETTLEMENT MODAL */}
      {settlementTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-[#EEF0E9] pb-4">
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                  Final settlement
                </p>

                <h2 className="mt-0.5 text-sm font-medium text-[#294436]">
                  {settlementTarget.fullName}
                </h2>

                <p className="mt-0.5 text-xs text-[#859083]">
                  Enter the actual refund paid or amount received.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSettlementTarget(null)
                }
                className="rounded-lg p-1.5 text-[#7D887D] transition hover:bg-[#F2F4EC] hover:text-[#294436]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-medium text-[#304B35]">
                Actual amount
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={settlementAmount}
                onChange={(event) =>
                  setSettlementAmount(
                    event.target.value
                  )
                }
                placeholder="Enter amount"
                className="mt-1.5 h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
              />
            </label>

            <label className="mt-3.5 block">
              <span className="text-xs font-medium text-[#304B35]">
                Note
              </span>

              <input
                maxLength={300}
                value={settlementNote}
                onChange={(event) =>
                  setSettlementNote(
                    event.target.value
                  )
                }
                placeholder="Optional settlement note"
                className="mt-1.5 h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
              />
            </label>

            <div className="mt-5 flex gap-2 border-t border-[#EEF0E9] pt-4">
              <button
                type="button"
                onClick={() =>
                  setSettlementTarget(null)
                }
                className="flex-1 rounded-lg border border-[#E3E6DE] px-3.5 py-2 text-xs font-medium text-[#40543E] transition hover:bg-[#F2F4EC]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void completeSettlement()
                }
                disabled={settling}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-[#295640] disabled:opacity-60"
              >
                {settling && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}

                Mark settled
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}