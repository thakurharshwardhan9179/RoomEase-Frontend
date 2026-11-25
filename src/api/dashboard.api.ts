import api from "./axios";

export interface DashboardTenant {
  tenantId: string;
  fullName: string;
  mobileNumber: string;
  rooms: string[];
  totalRent: number;
  dueDate: string;
  balanceDue: number;
  advanceBalance: number;
  status: "Paid" | "Upcoming" | "DueSoon" | "Overdue";
  whatsappLink: string | null;
}

export interface DashboardOverview {
  totalProperties: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  occupancyRate: number;
  activeTenants: number;
  inactiveTenants: number;
  expectedThisMonth: number;
  collectedThisMonth: number;
  totalOutstanding: number;
  totalAdvanceCredit: number;
  totalExpensesThisMonth: number;
  netProfitThisMonth: number;
}

export interface DashboardStatusBreakdown {
  paidCount: number;
  upcomingCount: number;
  dueSoonCount: number;
  overdueCount: number;
}

export interface DashboardSummary {
  overview: DashboardOverview;
  statusBreakdown: DashboardStatusBreakdown;
  taskSummary?: {
    openTasks: number;
    inProgressTasks: number;
    roomsNeedingCleaning: number;
  };
  tenants: DashboardTenant[];
}

export interface DashboardInsight {
  type: string;
  priority: "High" | "Medium" | "Low";
  title: string;
  description: string;
}
export type TenantStatus =
  | "Paid"
  | "Upcoming"
  | "DueSoon"
  | "Overdue";

export const getDashboardSummary = async (
  propertyId?: string
): Promise<DashboardSummary> => {
  const response = await api.get("/api/Dashboard/summary", {
    params: propertyId ? { propertyId } : undefined,
  });

  return response.data;
};

export const getDashboardInsights = async (
  propertyId?: string
): Promise<DashboardInsight[]> => {
  const response = await api.get("/api/Dashboard/insights", {
    params: propertyId ? { propertyId } : undefined,
  });

  return response.data;
};
