import api from "./axios";
import {
  getGuestSessionToken,
  clearGuestSession,
} from "../utils/guestSession";

/* =========================================================
   TYPES
========================================================= */

export type GuestDepartment =
  | "Housekeeping"
  | "Maintenance"
  | "IT"
  | "FnB"
  | "Other";

export type PaymentMode =
  | "Cash"
  | "AddToBill";

export interface GuestContext {
  propertyName: string;
  roomNumber: string;
  bedNumber: string;
  guestName: string | null;
  hasActiveGuest?: boolean;
}

export interface GuestService {
  serviceId: string;
  name: string;
  department:
    | "Housekeeping"
    | "Maintenance"
    | "IT"
    | "Other";
  description?: string | null;
  sortOrder: number;
}

export interface CreateGuestRequest {
  serviceId: string;
  description?: string;
}

export interface GuestRequestResponse {
  message?: string;
  taskId?: string;
  guestTrackingToken?: string;
}

export interface GuestMenuItem {
  menuItemId: string;
  name: string;
  category?: string | null;
  price: number;
}

export interface GuestOrderItem {
  menuItemId: string;
  quantity: number;
}

export interface GuestOrderRequest {
  items: GuestOrderItem[];
  paymentMode: PaymentMode;
}

export interface GuestOrderResponse {
  message?: string;
  taskId?: string;
  guestTrackingToken?: string;
}

/* =========================================================
   NEW: GUEST REQUESTS
========================================================= */

export interface GuestRequestItem {
  taskId: string;
  title: string;
  description?: string | null;
  status: string;
  assignedStaffName?: string | null;
  rating?: number | null;
  canCancel: boolean;
  createdAt?: string | null;
  completedAt?: string | null;
  guestTrackingToken?: string | null;
}

export interface GuestRequestsResponse {
  items: GuestRequestItem[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

/* =========================================================
   NEW: GUEST BILL
========================================================= */

export interface GuestBillItem {
  id?: string;
  chargeId?: string;

  description?: string | null;
  title?: string | null;

  amount: number;

  createdAt?: string | null;
}

export interface GuestBillResponse {
  items: GuestBillItem[];
  total?: number;
  totalAmount?: number;
}

/* =========================================================
   PUBLIC TRACKING
========================================================= */

export interface GuestTrackingItem {
  title: string;
  status: string;
  assignedStaffName?: string | null;
  rating?: number | null;
  createdAt?: string;
  completedAt?: string | null;
}

/* =========================================================
   SESSION CONFIG
========================================================= */

function guestConfig() {
  const token =
    getGuestSessionToken();

  if (!token) {
    clearGuestSession();

    throw new Error(
      "Guest session has expired."
    );
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

/* =========================================================
   GUEST CONTEXT
========================================================= */

export const getGuestContext =
  async (): Promise<GuestContext> => {
    const response =
      await api.get(
        "/api/guest/context",
        guestConfig()
      );

    return response.data;
  };

/* =========================================================
   GUEST SERVICES
========================================================= */

export const getGuestServices =
  async (): Promise<GuestService[]> => {
    const data =
      (
        await api.get(
          "/api/guest/services",
          guestConfig()
        )
      ).data;

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.items)) {
      return data.items;
    }

    return [];
  };

/* =========================================================
   CREATE SERVICE REQUEST
========================================================= */

export const createGuestRequest =
  async (
    data: CreateGuestRequest
  ): Promise<GuestRequestResponse> => {
    const response =
      await api.post(
        "/api/guest/requests",
        data,
        guestConfig()
      );

    return response.data;
  };

/* =========================================================
   GUEST MENU
========================================================= */

export const getGuestMenu =
  async (): Promise<GuestMenuItem[]> => {
    const data =
      (
        await api.get(
          "/api/guest/menu",
          guestConfig()
        )
      ).data;

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.items)) {
      return data.items;
    }

    return [];
  };

/* =========================================================
   CREATE FOOD ORDER
========================================================= */

export const createGuestOrder =
  async (
    data: GuestOrderRequest
  ): Promise<GuestOrderResponse> => {
    const response =
      await api.post(
        "/api/guest/orders",
        data,
        guestConfig()
      );

    return response.data;
  };

/* =========================================================
   NEW: GET ALL GUEST REQUESTS
========================================================= */

export const getGuestRequests =
  async (): Promise<GuestRequestsResponse> => {
    const data =
      (
        await api.get(
          "/api/guest/requests",
          guestConfig()
        )
      ).data;

    /*
      Backend future-proof handling:
      direct array
      OR { items: [] }
      OR { requests: [] }
    */

    if (Array.isArray(data)) {
      return {
        items: data,
        totalCount: data.length,
      };
    }

    return {
      items: Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.requests)
          ? data.requests
          : [],

      totalCount:
        typeof data?.totalCount ===
        "number"
          ? data.totalCount
          : undefined,

      page:
        typeof data?.page ===
        "number"
          ? data.page
          : undefined,

      pageSize:
        typeof data?.pageSize ===
        "number"
          ? data.pageSize
          : undefined,

      totalPages:
        typeof data?.totalPages ===
        "number"
          ? data.totalPages
          : undefined,
    };
  };

/* =========================================================
   NEW: CANCEL GUEST REQUEST
========================================================= */

export const cancelGuestRequest =
  async (
    taskId: string
  ) => {
    const response =
      await api.post(
        `/api/guest/requests/${taskId}/cancel`,
        {},
        guestConfig()
      );

    return response.data;
  };

/* =========================================================
   NEW: GET GUEST BILL
========================================================= */

export const getGuestBill =
  async (): Promise<GuestBillResponse> => {
    const data =
      (
        await api.get(
          "/api/guest/bill",
          guestConfig()
        )
      ).data;

    /*
      Supports:
        { items: [], totalAmount }
      OR
        { charges: [], total }
      OR
        []
    */

    if (Array.isArray(data)) {
      const items =
        data as GuestBillItem[];

      return {
        items,
        totalAmount:
          items.reduce(
            (sum, item) =>
              sum +
              Number(
                item.amount || 0
              ),
            0
          ),
      };
    }

    const items =
      Array.isArray(data?.items)
        ? data.items
        : Array.isArray(
              data?.charges
            )
          ? data.charges
          : [];

    const calculatedTotal =
      items.reduce(
        (
          sum: number,
          item: GuestBillItem
        ) =>
          sum +
          Number(
            item.amount || 0
          ),
        0
      );

    return {
      items,

      total:
        typeof data?.total ===
        "number"
          ? data.total
          : undefined,

      totalAmount:
        typeof data?.totalAmount ===
        "number"
          ? data.totalAmount
          : typeof data?.total ===
              "number"
            ? data.total
            : calculatedTotal,
    };
  };

/* =========================================================
   PUBLIC TRACKING
========================================================= */

export const getGuestTaskStatus =
  async (
    guestTrackingToken: string
  ): Promise<GuestTrackingItem> => {
    const response =
      await api.get(
        `/api/public/guest-tasks/${guestTrackingToken}`
      );

    return response.data;
  };

/* =========================================================
   RATE GUEST TASK
========================================================= */

export const rateGuestTask =
  async (
    guestTrackingToken: string,
    rating: number
  ) => {
    const response =
      await api.post(
        `/api/public/guest-tasks/${guestTrackingToken}/rate`,
        {
          rating,
        }
      );

    return response.data;
  };