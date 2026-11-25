import { Link } from "react-router-dom";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  IndianRupee,
  MessageCircle,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

import {
  getDashboardInsights,
  getDashboardSummary,
  type DashboardInsight,
  type DashboardSummary,
  type TenantStatus,
} from "../../api/dashboard.api";

import {
  getProperties,
  type Property,
} from "../../api/properties.api";

/* ───────────────────── Helpers ───────────────────── */

const currency = (value: number | null | undefined) =>
  `₹${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value ?? 0)}`;

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "T";

const percent = (value: number) =>
  Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 0;

const statusConfig: Record<
  TenantStatus,
  {
    label: string;
    classes: string;
  }
> = {
  Paid: {
    label: "Paid",
    classes: "bg-[#E8EFE8] text-[#356248]",
  },
  Upcoming: {
    label: "Upcoming",
    classes: "bg-[#EDF1F3] text-[#5C7180]",
  },
  DueSoon: {
    label: "Due soon",
    classes: "bg-[#F7EEDC] text-[#9B712F]",
  },
  Overdue: {
    label: "Overdue",
    classes: "bg-[#F8EAE5] text-[#A2634B]",
  },
};

type StatusFilter = "All" | TenantStatus;

const panel =
  "rounded-xl border border-[#E3E6DE] bg-white";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#DDE8DE]";

/* ───────────────────── Small components ───────────────────── */

function Metric({
  label,
  value,
  note,
  icon: Icon,
  warning = false,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Users;
  warning?: boolean;
}) {
  return (
    <div className={`${panel} p-5 transition-colors hover:border-[#C7D3C7]`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[#7D887F]">{label}</p>
        <Icon
          strokeWidth={1.5}
          className="h-4 w-4 shrink-0 text-[#7D887F]"
        />
      </div>

      <p className="mt-3 break-words text-[30px] font-medium leading-tight tracking-[-0.045em] text-[#263F33]">
        {value}
      </p>

      <p
        className={`mt-3 text-[11px] leading-5 ${
          warning ? "text-[#A47A3E]" : "text-[#678471]"
        }`}
      >
        {note}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-5 py-10 text-center">
      <CheckCircle2
        strokeWidth={1.4}
        className="mx-auto h-7 w-7 text-[#7A9A80]"
      />
      <p className="mt-3 text-sm font-medium text-[#2B4437]">
        {title}
      </p>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#889187]">
        {description}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard"
      className="min-h-screen bg-[#F7F6F0] p-4 sm:p-7 lg:p-9"
    >
      <span className="sr-only">Loading dashboard...</span>

      <div className="w-full animate-pulse space-y-5 motion-reduce:animate-none">
        <div className="h-20 w-2/3 rounded-xl bg-[#E7E9E0]" />
        <div className="h-10 rounded-lg bg-[#E7E9E0]" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-36 rounded-xl bg-[#E7E9E0]"
            />
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="h-72 rounded-xl bg-[#E7E9E0]" />
          <div className="h-72 rounded-xl bg-[#E7E9E0]" />
        </div>

        <div className="h-80 rounded-xl bg-[#E7E9E0]" />
      </div>
    </div>
  );
}

/* ───────────────────── Dashboard ───────────────────── */

export default function Dashboard() {
  const [summary, setSummary] =
    useState<DashboardSummary | null>(null);

  const [insights, setInsights] =
    useState<DashboardInsight[]>([]);

  const [properties, setProperties] =
    useState<Property[]>([]);

  const [propertyId, setPropertyId] = useState(() => {
    try {
      return localStorage.getItem("roomease_property_id") || "";
    } catch {
      return "";
    }
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");

  const [showAllTenants, setShowAllTenants] = useState(false);
  const [showAllFollowUps, setShowAllFollowUps] = useState(false);

  const requestIdRef = useRef(0);

  const owner = useMemo(() => {
    try {
      const raw = localStorage.getItem("roomease_owner");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const loadDashboard = useCallback(
    async (showSpinner = true) => {
      const requestId = ++requestIdRef.current;

      setError("");

      if (showSpinner) {
        setLoading(true);
        setRefreshing(false);
      } else {
        setRefreshing(true);
      }

      try {
        const [summaryData, insightsData] = await Promise.all([
          getDashboardSummary(propertyId || undefined),
          getDashboardInsights(propertyId || undefined),
        ]);

        if (requestId !== requestIdRef.current) return;

        setSummary(summaryData);
        setInsights(insightsData ?? []);
        setLastUpdated(new Date());
      } catch (err) {
        if (requestId !== requestIdRef.current) return;

        console.error("Dashboard load failed", err);

        setError(
          "Unable to load dashboard data. Check your backend connection and try again."
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [propertyId]
  );

  useEffect(() => {
    let active = true;

    getProperties({ page: 1, pageSize: 100 })
      .then((response) => {
        if (active) setProperties(response.items ?? []);
      })
      .catch((err) => {
        console.error("Properties load failed", err);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void loadDashboard(true);

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadDashboard]);

  useEffect(() => {
    setShowAllTenants(false);
  }, [search, statusFilter, propertyId]);

  useEffect(() => {
    setShowAllFollowUps(false);
  }, [propertyId]);

  const handlePropertyChange = (value: string) => {
    setPropertyId(value);

    try {
      if (value) {
        localStorage.setItem("roomease_property_id", value);
      } else {
        localStorage.removeItem("roomease_property_id");
      }
    } catch {
      // The selector still works when browser storage is unavailable.
    }
  };

  const overview = summary?.overview;
  const breakdown = summary?.statusBreakdown;
  const tenants = summary?.tenants ?? [];

  const occupiedRate = percent(overview?.occupancyRate ?? 0);

  const expectedRent = overview?.expectedThisMonth ?? 0;
  const collectedRent = overview?.collectedThisMonth ?? 0;

  const collectionRate = expectedRent
    ? percent((collectedRent / expectedRent) * 100)
    : 0;

  const outstanding = overview?.totalOutstanding ?? 0;
  const vacantBeds = overview?.vacantBeds ?? 0;

  const roomsNeedingCleaning =
    summary?.taskSummary?.roomsNeedingCleaning ?? 0;

  const openTasks = summary?.taskSummary?.openTasks ?? 0;

  const propertyName = propertyId
    ? properties.find((item) => item.propertyId === propertyId)
        ?.propertyName || "your selected property"
    : "your properties";

  const firstName =
    typeof owner?.fullName === "string"
      ? owner.fullName.trim().split(/\s+/)[0] || "Owner"
      : "Owner";

  const monthLabel = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  const updatedLabel = lastUpdated
    ? new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(lastUpdated)
    : "";

  const followUps = tenants
    .filter((tenant) => tenant.balanceDue > 0)
    .sort((a, b) => {
      const statusRank = (status: TenantStatus) =>
        status === "Overdue" ? 0 : status === "DueSoon" ? 1 : 2;

      return (
        statusRank(a.status) - statusRank(b.status) ||
        b.balanceDue - a.balanceDue
      );
    });

  const visibleFollowUps = showAllFollowUps
    ? followUps
    : followUps.slice(0, 3);

  const filteredTenants = tenants.filter((tenant) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      [
        tenant.fullName,
        tenant.mobileNumber ?? "",
        ...(tenant.rooms ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

    return (
      matchesSearch &&
      (statusFilter === "All" || tenant.status === statusFilter)
    );
  });

  const visibleTenants = showAllTenants
    ? filteredTenants
    : filteredTenants.slice(0, 10);

  const priorityRank = (priority: string) =>
    priority === "High" ? 0 : priority === "Medium" ? 1 : 2;

  const sortedInsights = [...insights].sort(
    (a, b) => priorityRank(a.priority) - priorityRank(b.priority)
  );

  const chartMax = Math.max(expectedRent, collectedRent, 1);

  const chartItems = [
    {
      label: "Expected rent",
      value: expectedRent,
      color: "#E8E9DF",
    },
    {
      label: "Rent collected",
      value: collectedRent,
      color: "#78997D",
    },
  ];

  const paymentStatuses = [
    {
      label: "Paid",
      count: breakdown?.paidCount ?? 0,
      dot: "bg-[#78997D]",
    },
    {
      label: "Upcoming",
      count: breakdown?.upcomingCount ?? 0,
      dot: "bg-[#93A7AC]",
    },
    {
      label: "Due soon",
      count: breakdown?.dueSoonCount ?? 0,
      dot: "bg-[#C5AB73]",
    },
    {
      label: "Overdue",
      count: breakdown?.overdueCount ?? 0,
      dot: "bg-[#BC8F7C]",
    },
  ];

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      {/* Expanded full-width container matching layout */}
      <div className="w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">

        {/* Header */}
        <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
              Owner / Property overview
            </p>

            <h1 className="mt-2 text-[27px] font-medium leading-tight tracking-[-0.035em] text-[#294436] sm:text-[32px]">
              A good day starts with clarity.
            </h1>

            <p className="mt-2 text-xs leading-5 text-[#859083]">
              Welcome back, {firstName}. Here’s {propertyName} at a glance.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <label className="relative min-w-0 sm:w-52">
              <span className="sr-only">Select property</span>

              <Building2
                strokeWidth={1.5}
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6D8070]"
              />

              <select
                value={propertyId}
                onChange={(event) =>
                  handlePropertyChange(event.target.value)
                }
                className="h-10 w-full appearance-none rounded-lg border border-[#DFE4DA] bg-white pl-9 pr-8 text-[11px] font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:ring-4 focus:ring-[#E3EADF]"
              >
                <option value="">All properties</option>

                {propertyId &&
                  !properties.some(
                    (property) => property.propertyId === propertyId
                  ) && (
                    <option value={propertyId}>
                      Selected property
                    </option>
                  )}

                {properties.map((property) => (
                  <option
                    key={property.propertyId}
                    value={property.propertyId}
                  >
                    {property.propertyName}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[#758674]" />
            </label>

            <button
              type="button"
              onClick={() => void loadDashboard(false)}
              disabled={refreshing}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1D4435] px-4 text-[11px] font-medium text-white transition hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
            >
              <RefreshCw
                strokeWidth={1.6}
                className={`h-3.5 w-3.5 ${
                  refreshing
                    ? "animate-spin motion-reduce:animate-none"
                    : ""
                }`}
              />
              {refreshing ? "Refreshing..." : "Refresh overview"}
            </button>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="flex flex-col justify-between gap-3 rounded-lg border border-[#E7D4C7] bg-[#FBF0E9] px-4 py-3 sm:flex-row sm:items-center"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#A17255]" />

              <p className="text-xs leading-5 text-[#8A624D]">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadDashboard(false)}
              disabled={refreshing}
              className={`shrink-0 rounded-md border border-[#DEC7B8] bg-white px-3 py-2 text-[11px] font-medium text-[#815A43] disabled:opacity-60 ${focusRing}`}
            >
              Try again
            </button>
          </div>
        )}

        {/* Quiet portfolio notice */}
        <div className="flex flex-col justify-between gap-2 rounded-lg bg-[#E8EFE7] px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5">
            <Sparkles
              strokeWidth={1.5}
              className="mt-0.5 h-4 w-4 shrink-0 text-[#496D50]"
            />

            <p className="text-[11px] leading-5 text-[#3F5C45]">
              {overview?.occupiedBeds ?? 0} occupied beds.{" "}
              {vacantBeds > 0
                ? `${vacantBeds} bed(s) currently vacant.`
                : "All beds are currently occupied."}
              {roomsNeedingCleaning > 0 &&
                ` ${roomsNeedingCleaning} room/bed(s) need housekeeping before check-in.`}
            </p>
          </div>

          {(roomsNeedingCleaning > 0 || openTasks > 0) && (
            <Link
              to="/operations"
              className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded text-[10px] font-semibold text-[#365A40] sm:self-auto ${focusRing}`}
            >
              View operations
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Metrics */}
        <section
          aria-label="Portfolio metrics"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Metric
            label="Bed occupancy"
            value={`${Number(occupiedRate.toFixed(1))}%`}
            note={`${overview?.occupiedBeds ?? 0} occupied / ${
              overview?.totalBeds ?? 0
            } total beds`}
            icon={BedDouble}
          />

          <Metric
            label="Expected monthly rent"
            value={currency(expectedRent)}
            note={`${monthLabel} · ${
              propertyId ? "this property" : "all properties"
            }`}
            icon={CalendarDays}
          />

          <Metric
            label="Rent collected"
            value={currency(collectedRent)}
            note={`${collectionRate.toFixed(1)}% of expected rent`}
            icon={WalletCards}
          />

          <Metric
            label="Outstanding rent"
            value={currency(outstanding)}
            note={`${followUps.length} tenant(s) with a balance due`}
            icon={Clock3}
            warning={outstanding > 0}
          />
        </section>

        {/* Collection and follow-ups */}
        <section className="grid items-start gap-5 lg:grid-cols-[1.55fr_1fr]">

          {/* Collection */}
          <div className={`${panel} p-5 sm:p-6`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-medium tracking-tight text-[#294434]">
                  Rent collection
                </h2>

                <p className="mt-1 text-[11px] text-[#8A9387]">
                  Property performance · {monthLabel}
                </p>
              </div>

              <span className="rounded-md bg-[#EFF3EC] px-2 py-1 text-[9px] font-medium text-[#55755A]">
                {collectionRate.toFixed(1)}% collected
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-4">
              {chartItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 text-[10px] text-[#889184]"
                >
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </div>
              ))}
            </div>

            {/* Current-month comparison: actual API values only */}
            <div className="relative mt-5">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 flex h-36 flex-col justify-between"
              >
                {[0, 1, 2, 3].map((line) => (
                  <div
                    key={line}
                    className="border-t border-dashed border-[#EDF0E8]"
                  />
                ))}
              </div>

              <div className="relative flex h-36 items-end justify-center gap-12 border-b border-[#E8EDE3] px-5 sm:gap-24">
                {chartItems.map((item) => (
                  <div
                    key={item.label}
                    role="img"
                    aria-label={`${item.label}: ${currency(item.value)}`}
                    className="flex h-full w-20 flex-col justify-end sm:w-24"
                  >
                    <p className="mb-2 text-center text-[11px] font-medium text-[#425C46]">
                      {currency(item.value)}
                    </p>

                    <div
                      className="w-full rounded-t-[4px] transition-all duration-700 motion-reduce:transition-none"
                      style={{
                        backgroundColor: item.color,
                        height: `${
                          (Math.max(0, item.value) / chartMax) * 100
                        }px`,
                        minHeight: item.value > 0 ? 4 : 0,
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-2 flex justify-center gap-12 px-5 sm:gap-24">
                {chartItems.map((item) => (
                  <span
                    key={item.label}
                    className="w-20 text-center text-[10px] text-[#879181] sm:w-24"
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#EEF0E9] pt-4 sm:grid-cols-4">
              {paymentStatuses.map((item) => (
                <div key={item.label}>
                  <p className="flex items-center gap-1.5 text-[10px] text-[#879181]">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${item.dot}`}
                    />
                    {item.label}
                  </p>

                  <p className="mt-1.5 text-lg font-medium text-[#36503C]">
                    {item.count}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Follow-ups */}
          <div className={`${panel} p-5 sm:p-6`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium tracking-tight text-[#294434]">
                  A little follow-up goes a long way
                </h2>

                <p className="mt-1 text-[11px] leading-5 text-[#8A9387]">
                  {currency(outstanding)} outstanding across your portfolio
                </p>
              </div>

              {followUps.length > 3 && (
                <button
                  type="button"
                  onClick={() =>
                    setShowAllFollowUps((current) => !current)
                  }
                  className={`shrink-0 rounded text-[10px] text-[#53755A] hover:text-[#244A31] ${focusRing}`}
                >
                  {showAllFollowUps ? "Show less" : "View all"}
                </button>
              )}
            </div>

            {visibleFollowUps.length ? (
              <div className="mt-3 divide-y divide-[#EDF0E8]">
                {visibleFollowUps.map((tenant) => (
                  <div
                    key={tenant.tenantId}
                    className="flex items-start justify-between gap-3 py-4"
                  >
                    <div className="flex min-w-0 items-start gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF0E8] text-[9px] font-semibold text-[#4B6B50]">
                        {initials(tenant.fullName)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-[#334B38]">
                          {tenant.fullName}
                        </p>

                        <p className="mt-1 text-[9px] leading-4 text-[#8B9486]">
                          {tenant.rooms?.length
                            ? tenant.rooms.join(", ")
                            : "No room assigned"}
                          {" · "}Due {formatDate(tenant.dueDate)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-medium text-[#344C38]">
                        {currency(tenant.balanceDue)}
                      </p>

                      {tenant.whatsappLink && (
                        <a
                          href={tenant.whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`mt-1 inline-flex items-center gap-1 rounded text-[9px] text-[#64856A] hover:text-[#2A5637] ${focusRing}`}
                        >
                          Send reminder
                          <ArrowUpRight className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title={error ? "Follow-ups unavailable" : "Nothing overdue, nothing to chase"}
                description={
                  error
                    ? "Refresh your dashboard to load tenant balances."
                    : "No tenant balances require a follow-up right now."
                }
              />
            )}
          </div>
        </section>

        {/* Residents */}
        <section className={`${panel} overflow-hidden`}>
          <div className="flex flex-col justify-between gap-4 p-5 sm:p-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-sm font-medium tracking-tight text-[#294434]">
                Your residents
              </h2>

              <p className="mt-1 text-[11px] text-[#8A9387]">
                Current stays at {propertyName}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative">
                <span className="sr-only">Search residents</span>

                <Search
                  strokeWidth={1.5}
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B9584]"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Find a resident"
                  className="h-9 w-full rounded-md border border-[#E4E8DE] bg-white pl-8 pr-3 text-[11px] text-[#36503C] outline-none transition placeholder:text-[#9AA291] focus:border-[#9BB097] focus:ring-4 focus:ring-[#EDF2E8] sm:w-44"
                />
              </label>

              <label className="relative">
                <span className="sr-only">Filter rent status</span>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                  className="h-9 w-full appearance-none rounded-md border border-[#E4E8DE] bg-white pl-3 pr-8 text-[11px] text-[#61745D] outline-none transition focus:border-[#9BB097] focus:ring-4 focus:ring-[#EDF2E8] sm:w-32"
                >
                  <option value="All">All statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="DueSoon">Due soon</option>
                  <option value="Overdue">Overdue</option>
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[#8B9584]" />
              </label>
            </div>
          </div>

          {visibleTenants.length ? (
            <div className="px-5 sm:px-6">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] border-collapse text-left">
                  <thead>
                    <tr className="bg-[#F7F7F1] text-[9px] font-medium uppercase tracking-[0.04em] text-[#87917F]">
                      <th className="px-3 py-3 font-medium">Tenant</th>
                      <th className="px-3 py-3 font-medium">Room / bed</th>
                      <th className="px-3 py-3 font-medium">Monthly rent</th>
                      <th className="px-3 py-3 font-medium">Balance</th>
                      <th className="px-3 py-3 font-medium">Due date</th>
                      <th className="px-3 py-3 font-medium">Rent status</th>
                      <th className="px-3 py-3 text-right font-medium">
                        Contact
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#EAEDE4]">
                    {visibleTenants.map((tenant) => {
                      const status = statusConfig[tenant.status];

                      return (
                        <tr
                          key={tenant.tenantId}
                          className="text-[11px] text-[#40543E] transition-colors hover:bg-[#FAFBF7]"
                        >
                          <td className="px-3 py-4">
                            <p className="font-medium text-[#2D4935]">
                              {tenant.fullName}
                            </p>

                            {tenant.mobileNumber && (
                              <p className="mt-1 text-[9px] text-[#939B8C]">
                                {tenant.mobileNumber}
                              </p>
                            )}
                          </td>

                          <td className="px-3 py-4">
                            {tenant.rooms?.length
                              ? tenant.rooms.join(", ")
                              : "Not assigned"}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4">
                            {currency(tenant.totalRent)}
                            <span className="text-[9px] text-[#919B88]">
                              {" "}/ month
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-3 py-4">
                            {currency(tenant.balanceDue)}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 text-[#7D8C75]">
                            {formatDate(tenant.dueDate)}
                          </td>

                          <td className="px-3 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-medium ${status.classes}`}
                            >
                              <span className="h-1 w-1 rounded-full bg-current" />
                              {status.label}
                            </span>
                          </td>

                          <td className="px-3 py-4 text-right">
                            {tenant.whatsappLink ? (
                              <a
                                href={tenant.whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Message ${tenant.fullName} on WhatsApp`}
                                title="Open WhatsApp"
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4EBDF] text-[#638568] transition hover:bg-[#EDF3E8] ${focusRing}`}
                              >
                                <MessageCircle
                                  strokeWidth={1.5}
                                  className="h-3.5 w-3.5"
                                />
                              </a>
                            ) : (
                              <span className="text-[#ADB4A4]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <Users
                strokeWidth={1.4}
                className="mx-auto h-7 w-7 text-[#91A58A]"
              />

              <h3 className="mt-3 text-sm font-medium text-[#36503C]">
                {search || statusFilter !== "All"
                  ? "No matching residents"
                  : error
                    ? "Resident records unavailable"
                    : "A fresh start for your property"}
              </h3>

              <p className="mt-1 text-xs text-[#8C9782]">
                {search || statusFilter !== "All"
                  ? "Try a different name, room or rent status."
                  : error
                    ? "Refresh your dashboard to try again."
                    : "Your residents will appear here once they check in."}
              </p>

              {(search || statusFilter !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("All");
                  }}
                  className={`mt-4 rounded text-[11px] font-medium text-[#4F7753] ${focusRing}`}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
            <p className="text-[10px] text-[#929B88]">
              Showing {visibleTenants.length} of {filteredTenants.length}{" "}
              residents
            </p>

            {filteredTenants.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllTenants((current) => !current)}
                className={`inline-flex items-center gap-1.5 rounded text-[10px] font-medium text-[#4D7551] hover:text-[#254D2D] ${focusRing}`}
              >
                {showAllTenants
                  ? "Show fewer residents"
                  : `All ${filteredTenants.length} residents`}
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </section>

        {/* Bottom overview cards */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className={`${panel} p-5`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-[#304B35]">
                Operations
              </h2>

              <Link
                to="/operations"
                className={`inline-flex items-center gap-1 rounded text-[10px] text-[#5D805D] ${focusRing}`}
              >
                Open tasks
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-5 flex items-start gap-6">
              <div>
                <p className="text-[29px] font-medium leading-none tracking-tight text-[#304B35]">
                  {openTasks}
                </p>
                <p className="mt-2 text-[10px] text-[#8F9985]">
                  Open tasks
                </p>
              </div>

              <div className="space-y-2 pt-0.5">
                <p className="text-[10px] leading-5 text-[#71836A]">
                  {roomsNeedingCleaning} room/bed(s) need housekeeping
                </p>

                <span
                  className={`inline-flex rounded-md px-2 py-1 text-[9px] ${
                    openTasks || roomsNeedingCleaning
                      ? "bg-[#F7EEDC] text-[#94713A]"
                      : "bg-[#EAF0E6] text-[#557650]"
                  }`}
                >
                  {openTasks || roomsNeedingCleaning
                    ? "A little attention needed"
                    : "Everything is up to date"}
                </span>
              </div>
            </div>
          </div>

          <div className={`${panel} p-5`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-[#304B35]">
                Monthly finances
              </h2>

              <TrendingUp
                strokeWidth={1.5}
                className="h-4 w-4 text-[#839778]"
              />
            </div>

            <div className="mt-5 flex items-end justify-between gap-3">
              <div>
                <p className="break-words text-[27px] font-medium leading-none tracking-tight text-[#304B35]">
                  {currency(overview?.netProfitThisMonth)}
                </p>
                <p className="mt-2 text-[10px] text-[#8F9985]">
                  Net profit this month
                </p>
              </div>

              {(overview?.netProfitThisMonth ?? 0) < 0 ? (
                <ArrowDownRight className="h-5 w-5 shrink-0 text-[#AA8267]" />
              ) : (
                <ArrowUpRight className="h-5 w-5 shrink-0 text-[#73956C]" />
              )}
            </div>

            <p className="mt-4 border-t border-[#EDF0E7] pt-3 text-[10px] leading-5 text-[#8C9782]">
              {currency(overview?.totalExpensesThisMonth)} in recorded
              operating expenses
            </p>
          </div>

          <div className={`${panel} p-5`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-[#304B35]">
                Advance credit
              </h2>

              <IndianRupee
                strokeWidth={1.5}
                className="h-4 w-4 text-[#839778]"
              />
            </div>

            <p className="mt-5 break-words text-[27px] font-medium leading-none tracking-tight text-[#304B35]">
              {currency(overview?.totalAdvanceCredit)}
            </p>

            <p className="mt-2 text-[10px] text-[#8F9985]">
              Available towards future rent
            </p>

            <p className="mt-4 border-t border-[#EDF0E7] pt-3 text-[10px] leading-5 text-[#8C9782]">
              {overview?.activeTenants ?? 0} active tenants ·{" "}
              {overview?.inactiveTenants ?? 0} inactive
            </p>
          </div>
        </section>

        {/* Insights */}
        <section className={`${panel} p-5 sm:p-6`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-[#304B35]">
                Worth a little attention
              </h2>

              <p className="mt-1 text-[11px] text-[#8A9582]">
                Property insights, with the important things first.
              </p>
            </div>

            <span className="shrink-0 rounded-md bg-[#F2F4EC] px-2 py-1 text-[9px] text-[#77896E]">
              {insights.length} insights
            </span>
          </div>

          {sortedInsights.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sortedInsights.map((insight, index) => {
                const high = insight.priority === "High";
                const medium = insight.priority === "Medium";

                return (
                  <div
                    key={`${insight.type}-${index}`}
                    className="rounded-lg border border-[#E8ECE1] bg-[#FCFCF8] p-4"
                  >
                    <div className="flex items-start gap-2.5">
                      {high ? (
                        <AlertTriangle
                          strokeWidth={1.5}
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#A27B55]"
                        />
                      ) : (
                        <Clock3
                          strokeWidth={1.5}
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#85967B]"
                        />
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[11px] font-medium leading-5 text-[#40583D]">
                            {insight.title}
                          </h3>

                          <span
                            className={`rounded px-1.5 py-0.5 text-[8px] ${
                              high
                                ? "bg-[#F4E8DE] text-[#A07850]"
                                : medium
                                  ? "bg-[#F5EFDD] text-[#95814B]"
                                  : "bg-[#EAF0E5] text-[#708964]"
                            }`}
                          >
                            {insight.priority}
                          </span>
                        </div>

                        <p className="mt-1.5 text-[10px] leading-5 text-[#89957E]">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title={error ? "Insights unavailable" : "Everything looks good"}
              description={
                error
                  ? "Refresh the dashboard to load property insights."
                  : "No property insights need your attention right now."
              }
            />
          )}
        </section>

        {/* Footer */}
        <footer className="flex flex-col justify-between gap-2 pb-2 pt-1 text-[9px] leading-5 text-[#929C88] sm:flex-row">
          <p>
            All financial and occupancy figures above are for{" "}
            {propertyId ? propertyName : "your selected portfolio"}.
          </p>

          <p className="inline-flex items-center gap-1.5">
            <span
              className={`h-1 w-1 rounded-full ${
                error ? "bg-[#C09C63]" : "bg-[#8BA07A]"
              }`}
            />
            {error
              ? "Sync needs attention"
              : updatedLabel
                ? `Last updated at ${updatedLabel}`
                : "Awaiting update"}
          </p>
        </footer>
      </div>
    </div>
  );
}