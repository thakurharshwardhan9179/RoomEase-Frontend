import api from "./axios";

export interface ReminderLog {
  reminderLogId: string;
  tenantId: string;
  tenantName: string;
  mobileNumber: string;
  balanceDue: number;
  status: "Overdue" | "DueSoon" | string;
  checkedAt: string;
}

export interface ReminderHistoryResponse {
  items: ReminderLog[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export const getReminderHistory = async (
  params?: {
    propertyId?: string;
    page?: number;
    pageSize?: number;
  },
): Promise<ReminderHistoryResponse> => {
  const response = await api.get(
    "/api/Dashboard/reminder-history",
    {
      params,
    },
  );

  const data = response.data ?? {};

  const items = Array.isArray(data)
    ? data
    : Array.isArray(data.items)
      ? data.items
      : [];

  const totalCount = Number(
    data.totalCount ?? items.length,
  );

  const page = Number(
    data.page ?? params?.page ?? 1,
  );

  const pageSize = Number(
    data.pageSize ??
      params?.pageSize ??
      20,
  );

  return {
    items: items as ReminderLog[],
    totalCount,
    page,
    pageSize,
  };
};