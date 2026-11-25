import api, { withSignal } from "./axios";

export interface AuditLog {
  auditLogId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  items: AuditLog[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Backend AuditLogsController currently supports only page and pageSize.
 * Server-side filtering by action, entityType, and search is not supported by the backend.
 */
export interface GetAuditLogsParams {
  page?: number;
  pageSize?: number;
}

export const getAuditLogs = async (
  params?: GetAuditLogsParams,
  signal?: AbortSignal,
): Promise<AuditLogsResponse> => {
  const response = await api.get("/api/AuditLogs", {
    params: {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    },
    ...withSignal(undefined, signal),
  });

  const data = response.data ?? {};

  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data.items)
      ? data.items
      : [];

  const items = rawItems as AuditLog[];

  const totalCount = Number(
    data.totalCount ?? items.length,
  );

  const page = Number(
    data.page ?? params?.page ?? 1,
  );

  const pageSize = Number(
    data.pageSize ?? params?.pageSize ?? 20,
  );

  const totalPages = Number(
    data.totalPages ??
      Math.max(1, Math.ceil(totalCount / (pageSize || 20))),
  );

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
};
