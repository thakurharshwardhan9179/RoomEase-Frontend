import api from "./axios";

export type PaymentMode = "Cash" | "UPI" | "Bank Transfer";

export interface PaymentRecord {
  paymentId: string;
  tenantId: string;
  amountPaid: number;
  paymentMode: PaymentMode;
  forMonth: string;
  paidOn: string;
  ownerId?: string;
  propertyId?: string | null;
  voidedAt?: string | null;
  nextDueDate?: string;
  isVoided?: boolean;
  voidReason?: string | null;
}

export interface PaymentResult {
  totalExpected: number;
  totalPaid: number;
  balanceDue: number;
  advanceBalance: number;
  status: "Paid" | "Upcoming" | "DueSoon" | "Overdue";
}

export const markPaymentPaid = async (data: {
  tenantId: string;
  amountPaid: number;
  paymentMode: PaymentMode;
  forMonth: string;
}) => {
  const response = await api.post<{ message: string; data: PaymentResult }>(
    "/api/Payments/mark-paid",
    data,
  );
  return response.data;
};

export const getPaymentHistory = async (tenantId: string): Promise<PaymentRecord[]> => {
  const response = await api.get<PaymentRecord[]>(`/api/Payments/history/${tenantId}`);
  return response.data;
};

export const voidPayment = async (paymentId: string, reason: string) => {
  const response = await api.post(`/api/Payments/${paymentId}/void`, { reason });
  return response.data;
};
