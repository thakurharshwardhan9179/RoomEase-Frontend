import api from "./axios";

export type TenantStatus =
  | "Paid"
  | "Upcoming"
  | "DueSoon"
  | "Overdue";

export type PaymentMode =
  | "Cash"
  | "UPI"
  | "Bank Transfer";

export interface TenantRoom {
  bedId: string;
  propertyName: string;
  roomNumber: string;
  bedNumber: string;
  agreedRent: number;
  depositAmount?: number;
}

export interface Tenant {
  tenantId: string;
  fullName: string;
  mobileNumber: string;
  totalRent: number;
  balanceDue: number;
  advanceBalance?: number;
  depositAmount?: number;
  agreementEndDate?: string | null;
  joiningDate?: string | null;
  nextDueDate?: string | null;
  checkoutDate?: string | null;

  // Checkout / settlement fields
  settlementStatus?: "Pending" | "Settled" | null;
  settledAmount?: number | null;
  settledAt?: string | null;
  settlementNote?: string | null;

  status: TenantStatus;
  rooms: TenantRoom[];
  whatsappLink?: string | null;
}

export interface TenantsResponse {
  items: Tenant[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Payment {
  paymentId: string;
  tenantId: string;
  amountPaid: number;
  paidOn: string;
  paymentMode: PaymentMode;
  forMonth: string;
  nextDueDate: string;
  isVoided?: boolean;
  ownerId?: string;
  propertyId?: string | null;
  voidedAt?: string | null;
  voidReason?: string | null;
}

export interface CheckoutStayHistoryItem {
  propertyName: string;
  roomNumber: string;
  bedNumber: string;
  agreedRent: number;
  startDate: string;
  endDate: string;
  daysStayed: number;
}

export interface CheckoutPaymentHistoryItem {
  paymentId?: string;
  amountPaid: number;
  paymentMode: string;
  forMonth: string;
  paidOn: string;
}

export interface CheckoutResult {
  tenantId: string;
  fullName: string;
  mobileNumber: string;
  joiningDate: string;
  checkoutDate: string;
  totalStayDays: number;

  stayHistory: CheckoutStayHistoryItem[];

  totalExpectedRent: number;
  totalPaid: number;
  paymentHistory: CheckoutPaymentHistoryItem[];

  depositAmount: number;
  outstandingRentBalance: number;
  advanceBalance: number;

  // Misc charges added by guest AddToBill orders.
  miscCharges?: number;

  settlementType: "Refund" | "AmountDue";
  refundableAmount: number;
  amountDueFromTenant: number;

  settlementStatus:
    | "Pending"
    | "Settled"
    | null;

  settledAmount?: number | null;
  settledAt?: string | null;
  settlementNote?: string | null;
}

export interface PendingSettlement {
  tenantId: string;
  fullName: string;
  mobileNumber: string;
  checkoutDate: string | null;
  depositAmount: number;

  // Backend's current pending-refunds endpoint may expose
  // only the fields above. Keep these optional for forward compatibility.
  settlementStatus?: "Pending" | "Settled" | null;
  refundableAmount?: number | null;
  amountDueFromTenant?: number | null;
}

export interface SettleRefundRequest {
  actualAmount: number;
  note?: string;
}

export interface ApiMessageResponse {
  message: string;
}

function normalizeTenantsResponse(
  data: unknown,
): TenantsResponse {
  if (Array.isArray(data)) {
    return {
      items: data as Tenant[],
      totalCount: data.length,
      page: 1,
      pageSize: data.length || 10,
      totalPages: 1,
    };
  }

  const value =
    (data ?? {}) as Record<
      string,
      unknown
    >;

  const rawItems =
    Array.isArray(value.items)
      ? value.items
      : [];

  const items =
    rawItems as Tenant[];

  const totalCount = Number(
    value.totalCount ??
      items.length,
  );

  const page = Number(
    value.page ?? 1,
  );

  const pageSize = Number(
    value.pageSize ??
      (items.length || 10),
  );

  const totalPages = Number(
    value.totalPages ??
      Math.max(
        1,
        Math.ceil(
          totalCount / pageSize,
        ),
      ),
  );

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

export const getTenants =
  async (params?: {
    search?: string;
    status?: TenantStatus;
    page?: number;
    pageSize?: number;
  }): Promise<TenantsResponse> => {
    const response =
      await api.get(
        "/api/Tenants/my-tenants",
        { params },
      );

    return normalizeTenantsResponse(
      response.data,
    );
  };

export const getExpiringAgreements =
  async (
    withinDays = 30,
  ): Promise<Tenant[]> => {
    const response =
      await api.get(
        "/api/Tenants/expiring-agreements",
        {
          params: { withinDays },
        },
      );

    return Array.isArray(
      response.data,
    )
      ? (response.data as Tenant[])
      : [];
  };

export interface CheckInTenantResponse {
  message?: string;
  stayAccessCode: string;
  tenantId?: string;
}

export const checkInTenant =
  async (data: {
    bedId: string;
    fullName: string;
    mobileNumber: string;
    agreedRent: number;
    depositAmount: number;
    joiningDate: string;
    agreementEndDate?: string | null;
  }): Promise<CheckInTenantResponse> => {
    const response =
      await api.post<CheckInTenantResponse>(
        "/api/Tenants/checkin",
        data,
      );

    return response.data;
  };

export const updateTenant =
  async (
    tenantId: string,
    data: {
      fullName?: string;
      mobileNumber?: string;
      depositAmount?: number;
      agreementEndDate?: string | null;
      documentUrl?: string;
    },
  ) => {
    const response =
      await api.put(
        `/api/Tenants/${tenantId}`,
        data,
      );

    return response.data;
  };

export interface AddBedResponse {
  assignmentId?: string;
  stayAccessCode: string;
  message: string;
}

export const addBedToTenant =
  async (data: {
    tenantId: string;
    bedId: string;
    agreedRent: number;
  }): Promise<AddBedResponse> => {
    const response =
      await api.post<AddBedResponse>(
        "/api/Tenants/add-bed",
        data,
      );

    return response.data;
  };

export interface TransferBedResponse {
  stayAccessCode: string;
  message: string;
}

export const transferTenantBed =
  async (data: {
    tenantId: string;
    oldBedId: string;
    newBedId: string;
    newAgreedRent: number;
  }): Promise<TransferBedResponse> => {
    const response =
      await api.post<TransferBedResponse>(
        "/api/Tenants/transfer-bed",
        data,
      );

    return response.data;
  };

export const checkoutTenant =
  async (
    tenantId: string,
  ): Promise<{
    message: string;
    data: CheckoutResult;
  }> => {
    const response =
      await api.post(
        `/api/Tenants/${tenantId}/checkout`,
      );

    return response.data;
  };

/**
 * Mark a post-checkout settlement as actually completed.
 *
 * Backend:
 * POST /api/Tenants/{tenantId}/settle-refund
 * Body:
 * {
 *   actualAmount: number,
 *   note?: string
 * }
 */
export const settleRefund =
  async (
    tenantId: string,
    data: SettleRefundRequest,
  ): Promise<ApiMessageResponse> => {
    const response =
      await api.post(
        `/api/Tenants/${tenantId}/settle-refund`,
        data,
      );

    return response.data;
  };

/**
 * Get checked-out tenants whose final refund / amount-due
 * settlement is still Pending.
 */
export const getPendingSettlements =
  async (): Promise<
    PendingSettlement[]
  > => {
    const response =
      await api.get(
        "/api/Tenants/pending-refunds",
      );

    return Array.isArray(
      response.data,
    )
      ? (response.data as PendingSettlement[])
      : [];
  };

export const getPaymentHistory =
  async (
    tenantId: string,
  ): Promise<Payment[]> => {
    const response =
      await api.get(
        `/api/Payments/history/${tenantId}`,
      );

    return Array.isArray(
      response.data,
    )
      ? (response.data as Payment[])
      : [];
  };

export const markPaymentPaid =
  async (data: {
    tenantId: string;
    amountPaid: number;
    paymentMode: PaymentMode;
    forMonth: string;
  }) => {
    const response =
      await api.post(
        "/api/Payments/mark-paid",
        data,
      );

    return response.data;
  };
