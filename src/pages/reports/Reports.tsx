import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  BedDouble,
  BellRing,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  RefreshCw,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";

import {
  getProperties,
  type Property,
} from "../../api/properties.api";

import {
  getTenants,
  type Tenant,
} from "../../api/tenants.api";

import {
  getReminderHistory,
  type ReminderLog,
} from "../../api/reminder.api";

import {
  getMyStaff,
  type Staff,
} from "../../api/staff.api";

import {
  getMyTasks,
  type TaskListItem,
} from "../../api/tasks.api";

import ReportCard from "./components/ReportCard";
import ReportHeader from "./components/ReportHeader";
import SummaryCard from "./components/SummaryCard";

import AvailabilityReport from "./sections/AvailabilityReport";
import TenantReport from "./sections/TenantReport";
import PaymentsReport from "./sections/PaymentsReport";
import ExpensesReport from "./sections/ExpensesReport";
import OperationsReport from "./sections/OperationsReport";
import ReminderReport from "./sections/ReminderReport";
import StaffReport from "./sections/StaffReport";
import PropertyReport from "./sections/PropertyReport";

import type {
  AvailabilityItem,
  AvailabilityTotals,
  PropertyWithStats,
  ReportCardDefinition,
  ReportExportRunner,
  ReportKey,
  ReminderStats,
  StaffStats,
  TaskStats,
} from "./report.types";

const reportCards: ReportCardDefinition[] = [
  {
    key: "tenants",
    title: "Tenant Report",
    description: "View current tenants and open their detailed records.",
    icon: <Users className="h-5 w-5 text-[#356248]" />,
    tone:
      "bg-[#E8EFE8] hover:bg-[#D5E2D5] border-[#D5E2D5] text-[#294436]",
    dataLabel: "Live tenant data",
  },
  {
    key: "availability",
    title: "Availability Report",
    description:
      "See rooms, beds, occupancy and jump directly to vacant or occupied beds.",
    icon: <BedDouble className="h-5 w-5 text-[#36503E]" />,
    tone:
      "bg-[#EDF1F3] hover:bg-[#DEE5E8] border-[#DFE4DA] text-[#294436]",
    dataLabel: "Live inventory data",
  },
  {
    key: "payments",
    title: "Payments Report",
    description: "Choose a tenant and export their payment history.",
    icon: <WalletCards className="h-5 w-5 text-[#55755A]" />,
    tone:
      "bg-[#F2F4EC] hover:bg-[#E5E9DC] border-[#E3E6DE] text-[#294436]",
    dataLabel: "Backend CSV export",
  },
  {
    key: "expenses",
    title: "Expense Report",
    description: "Choose a property and export its recorded expenses.",
    icon: <FileSpreadsheet className="h-5 w-5 text-[#304B35]" />,
    tone:
      "bg-[#E8EFE8] hover:bg-[#D5E2D5] border-[#D5E2D5] text-[#294436]",
    dataLabel: "Backend CSV export",
  },
  {
    key: "operations",
    title: "Operations Report",
    description: "Review task status, assignments and completion proof.",
    icon: <ClipboardList className="h-5 w-5 text-[#9B712F]" />,
    tone:
      "bg-[#F7EEDC] hover:bg-[#F2E5CE] border-[#F7EEDC] text-[#294436]",
    dataLabel: "Live task data",
  },
  {
    key: "reminders",
    title: "Reminder History",
    description: "Review overdue and due-soon reminder checks.",
    icon: <BellRing className="h-5 w-5 text-[#A2634B]" />,
    tone:
      "bg-[#FBF0E9] hover:bg-[#F7EEDC] border-[#E7D4C7] text-[#294436]",
    dataLabel: "Live reminder history",
  },
  {
    key: "staff",
    title: "Staff Report",
    description: "View active staff, department and current working status.",
    icon: <UserRound className="h-5 w-5 text-[#5C7180]" />,
    tone:
      "bg-[#EDF1F3] hover:bg-[#DEE5E8] border-[#DFE4DA] text-[#294436]",
    dataLabel: "Live staff data",
  },
  {
    key: "properties",
    title: "Property Report",
    description: "Open your properties and jump to their full detail pages.",
    icon: <Building2 className="h-5 w-5 text-[#356248]" />,
    tone:
      "bg-[#E8EFE8] hover:bg-[#D5E2D5] border-[#D5E2D5] text-[#294436]",
    dataLabel: "Live property data",
  },
];

function apiError(error: any, fallback: string) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export default function Reports() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [reminders, setReminders] = useState<ReminderLog[]>([]);
  const [totalReminders, setTotalReminders] = useState(0);

  const [tenantId, setTenantId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [reminderPage, setReminderPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<ReportKey | null>(null);

  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [refreshingBase, setRefreshingBase] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [exporting, setExporting] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadBaseData = useCallback(async () => {
    try {
      setRefreshingBase(true);
      setError("");

      const [propertyResponse, tenantResponse] = await Promise.all([
        getProperties({ page: 1, pageSize: 100 }),
        getTenants({ page: 1, pageSize: 100 }),
      ]);

      const propertyItems = propertyResponse.items || [];
      const tenantItems = tenantResponse.items || [];

      setProperties(propertyItems);
      setTenants(tenantItems);

      if (
        propertyItems.length > 0 &&
        !propertyItems.some(
          (item) => item.propertyId === propertyId
        )
      ) {
        setPropertyId(propertyItems[0].propertyId);
      }

      if (
        tenantItems.length > 0 &&
        !tenantItems.some(
          (item) => item.tenantId === tenantId
        )
      ) {
        setTenantId(tenantItems[0].tenantId);
      }
    } catch (err) {
      setError(
        apiError(err, "Unable to load report data.")
      );
    } finally {
      setRefreshingBase(false);
      setLoading(false);
    }
  }, [propertyId, tenantId]);

  useEffect(() => {
    void loadBaseData();
  }, []);

  useEffect(() => {
    if (!selectedReport) return;

    const loadReportData = async () => {
      try {
        setReportLoading(true);
        setError("");

        if (selectedReport === "operations") {
          const response = await getMyTasks({
            page: 1,
            pageSize: 100,
          });

          const items = Array.isArray(response)
            ? response
            : response.items || [];

          setTasks(items);
        }

        if (selectedReport === "staff") {
          const response = await getMyStaff({
            isActive: true,
            page: 1,
            pageSize: 100,
          });

          setStaff(response.items || []);
        }

        if (selectedReport === "reminders") {
          const response = await getReminderHistory({
            propertyId: propertyId || undefined,
            page: reminderPage,
            pageSize: 10,
          });

          setReminders(response.items || []);
          setTotalReminders(response.totalCount || 0);
        }
      } catch (err) {
        setError(
          apiError(err, "Unable to load this report.")
        );
      } finally {
        setReportLoading(false);
      }
    };

    void loadReportData();
  }, [
    selectedReport,
    propertyId,
    reminderPage,
    refreshTick,
  ]);

  const availability = useMemo<AvailabilityItem[]>(() => {
    return properties.map((item) => {
      const property = item as PropertyWithStats;
      const totalBeds = Number(property.totalBeds || 0);
      const occupiedBeds = Number(property.occupiedBeds || 0);
      const vacantBeds = Math.max(
        totalBeds - occupiedBeds,
        0
      );

      return {
        ...property,
        totalRooms: Number(property.totalRooms || 0),
        totalBeds,
        occupiedBeds,
        vacantBeds,
        occupancy: totalBeds
          ? Math.round(
              (occupiedBeds / totalBeds) * 100
            )
          : 0,
      };
    });
  }, [properties]);

  const availabilityTotals = useMemo<AvailabilityTotals>(() => {
    return availability.reduce(
      (acc, item) => {
        acc.rooms += Number(item.totalRooms || 0);
        acc.beds += Number(item.totalBeds || 0);
        acc.occupied += Number(item.occupiedBeds || 0);
        acc.vacant += Number(item.vacantBeds || 0);
        return acc;
      },
      {
        rooms: 0,
        beds: 0,
        occupied: 0,
        vacant: 0,
      }
    );
  }, [availability]);

  const taskStats = useMemo<TaskStats>(() => {
    return {
      total: tasks.length,
      open: tasks.filter(
        (item) => item.status === "Open"
      ).length,
      inProgress: tasks.filter(
        (item) => item.status === "InProgress"
      ).length,
      completed: tasks.filter(
        (item) => item.status === "Completed"
      ).length,
    };
  }, [tasks]);

  const staffStats = useMemo<StaffStats>(() => {
    return {
      total: staff.length,
      free: staff.filter(
        (member) => member.currentStatus === "Free"
      ).length,
      busy: staff.filter(
        (member) => member.currentStatus !== "Free"
      ).length,
    };
  }, [staff]);

  const reminderStats = useMemo<ReminderStats>(() => {
    return {
      overdue: reminders.filter(
        (item) => item.status === "Overdue"
      ).length,
      dueSoon: reminders.filter(
        (item) => item.status === "DueSoon"
      ).length,
    };
  }, [reminders]);

  const runExport: ReportExportRunner = async (
    key,
    action,
    message
  ) => {
    try {
      setExporting(key);
      setError("");
      setSuccess("");

      await action();
      setSuccess(message);

      window.setTimeout(
        () => setSuccess(""),
        2500
      );
    } catch (err) {
      setError(
        apiError(err, "Export failed.")
      );
    } finally {
      setExporting("");
    }
  };

  const openReport = (key: ReportKey) => {
    setSuccess("");
    setError("");
    setReminderPage(1);
    setSelectedReport(key);
  };

  const refreshCurrentReport = () => {
    if (!selectedReport) return;
    setError("");
    setSuccess("");
    setRefreshTick((value) => value + 1);
  };

  const liveCountFor = (key: ReportKey) => {
    switch (key) {
      case "tenants":
        return `${tenants.length} records loaded`;
      case "availability":
        return `${availabilityTotals.beds} beds tracked`;
      case "payments":
        return "CSV export available";
      case "expenses":
        return "CSV export available";
      case "operations":
        return selectedReport === "operations"
          ? `${taskStats.total} tasks loaded`
          : "Loads live data on open";
      case "reminders":
        return selectedReport === "reminders"
          ? `${totalReminders} records available`
          : "Loads live data on open";
      case "staff":
        return selectedReport === "staff"
          ? `${staffStats.total} staff loaded`
          : "Loads live data on open";
      case "properties":
        return `${properties.length} properties loaded`;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased pb-12">
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
        {!selectedReport ? (
          <>
            <section className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1D4435] text-white shadow-sm">
                      <ClipboardList className="h-4 w-4" />
                    </div>
                    <div>
                      <h1 className="text-xl font-medium tracking-tight text-[#294436] sm:text-2xl">
                        Reports & Analytics
                      </h1>
                      <p className="mt-0.5 text-xs text-[#859083]">
                        Open a report in one click, inspect live data, then jump into the relevant action.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void loadBaseData()}
                  disabled={refreshingBase}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#E3E6DE] bg-white px-3.5 text-xs font-medium text-[#40543E] shadow-sm transition hover:bg-[#F2F4EC] disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      refreshingBase ? "animate-spin" : ""
                    }`}
                  />
                  Refresh data
                </button>
              </div>
            </section>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] p-4 text-xs font-medium text-[#8A624D]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-[#D5E2D5] bg-[#E8EFE8] p-4 text-xs font-medium text-[#356248]">
                {success}
              </div>
            )}

            {!loading && (
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  label="Properties"
                  value={properties.length}
                  helper="Live property records"
                  icon={<Building2 className="h-3.5 w-3.5" />}
                  onClick={() => openReport("properties")}
                />

                <SummaryCard
                  label="Tenants"
                  value={tenants.length}
                  helper="Live tenant records"
                  icon={<Users className="h-3.5 w-3.5" />}
                  onClick={() => openReport("tenants")}
                />

                <SummaryCard
                  label="Total beds"
                  value={availabilityTotals.beds}
                  helper={`${availabilityTotals.occupied} currently occupied`}
                  icon={<BedDouble className="h-3.5 w-3.5" />}
                  onClick={() => openReport("availability")}
                />

                <SummaryCard
                  label="Vacant beds"
                  value={availabilityTotals.vacant}
                  helper="Click to inspect availability"
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                  onClick={() => openReport("availability")}
                />
              </section>
            )}

            <section className="mt-6">
              <div className="mb-3.5">
                <h2 className="text-sm font-medium text-[#294436]">
                  Choose a report
                </h2>
                <p className="mt-0.5 text-xs text-[#859083]">
                  Single click se detailed report open hoga.
                </p>
              </div>

              {loading ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-36 animate-pulse rounded-xl border border-[#E3E6DE] bg-white"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {reportCards.map((report) => (
                    <ReportCard
                      key={report.key}
                      report={report}
                      liveCount={liveCountFor(report.key)}
                      onClick={() => openReport(report.key)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <ReportDetail
            selectedReport={selectedReport}
            properties={properties}
            tenants={tenants}
            staff={staff}
            tasks={tasks}
            reminders={reminders}
            availability={availability}
            availabilityTotals={availabilityTotals}
            taskStats={taskStats}
            staffStats={staffStats}
            reminderStats={reminderStats}
            propertyId={propertyId}
            tenantId={tenantId}
            reminderPage={reminderPage}
            totalReminders={totalReminders}
            reportLoading={reportLoading}
            exporting={exporting}
            error={error}
            success={success}
            setPropertyId={setPropertyId}
            setTenantId={setTenantId}
            setReminderPage={setReminderPage}
            runExport={runExport}
            onBack={() => setSelectedReport(null)}
            onRefresh={refreshCurrentReport}
          />
        )}
      </div>
    </div>
  );
}

function ReportDetail({
  selectedReport,
  properties,
  tenants,
  staff,
  tasks,
  reminders,
  availability,
  availabilityTotals,
  taskStats,
  staffStats,
  reminderStats,
  propertyId,
  tenantId,
  reminderPage,
  totalReminders,
  reportLoading,
  exporting,
  error,
  success,
  setPropertyId,
  setTenantId,
  setReminderPage,
  runExport,
  onBack,
  onRefresh,
}: {
  selectedReport: ReportKey;
  properties: Property[];
  tenants: Tenant[];
  staff: Staff[];
  tasks: TaskListItem[];
  reminders: ReminderLog[];
  availability: AvailabilityItem[];
  availabilityTotals: AvailabilityTotals;
  taskStats: TaskStats;
  staffStats: StaffStats;
  reminderStats: ReminderStats;
  propertyId: string;
  tenantId: string;
  reminderPage: number;
  totalReminders: number;
  reportLoading: boolean;
  exporting: string;
  error: string;
  success: string;
  setPropertyId: (value: string) => void;
  setTenantId: (value: string) => void;
  setReminderPage: (value: number) => void;
  runExport: ReportExportRunner;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const meta = reportCards.find(
    (item) => item.key === selectedReport
  );

  return (
    <>
      <ReportHeader
        icon={meta?.icon}
        title={meta?.title || "Report"}
        description={meta?.description || ""}
        onBack={onBack}
        onRefresh={onRefresh}
        loading={reportLoading}
      />

      {error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] p-4 text-xs font-medium text-[#8A624D]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-xl border border-[#D5E2D5] bg-[#E8EFE8] p-4 text-xs font-medium text-[#356248]">
          {success}
        </div>
      )}

      {selectedReport === "tenants" && (
        <TenantReport
          tenants={tenants}
          properties={properties}
          propertyId={propertyId}
          exporting={exporting}
          setPropertyId={setPropertyId}
          runExport={runExport}
        />
      )}

      {selectedReport === "availability" && (
        <AvailabilityReport
          availability={availability}
          totals={availabilityTotals}
          properties={properties}
        />
      )}

      {selectedReport === "payments" && (
        <PaymentsReport
          tenants={tenants}
          tenantId={tenantId}
          exporting={exporting}
          setTenantId={setTenantId}
          runExport={runExport}
        />
      )}

      {selectedReport === "expenses" && (
        <ExpensesReport
          properties={properties}
          propertyId={propertyId}
          exporting={exporting}
          setPropertyId={setPropertyId}
          runExport={runExport}
        />
      )}

      {selectedReport === "operations" && (
        <OperationsReport
          tasks={tasks}
          stats={taskStats}
          loading={reportLoading}
        />
      )}

      {selectedReport === "reminders" && (
        <ReminderReport
          properties={properties}
          propertyId={propertyId}
          reminders={reminders}
          page={reminderPage}
          total={totalReminders}
          stats={reminderStats}
          loading={reportLoading}
          setPropertyId={setPropertyId}
          setPage={setReminderPage}
        />
      )}

      {selectedReport === "staff" && (
        <StaffReport
          staff={staff}
          stats={staffStats}
          loading={reportLoading}
        />
      )}

      {selectedReport === "properties" && (
        <PropertyReport properties={properties} />
      )}
    </>
  );
}