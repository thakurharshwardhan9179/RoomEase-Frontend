import api from "./axios";

export type ExpensePaymentMode =
  | "Cash"
  | "UPI"
  | "Bank Transfer"
  | "Other";

export interface Expense {
  expenseId: string;
  category: string;
  amount: number;
  paymentMode: ExpensePaymentMode;
  expenseDate: string;
  note?: string | null;
}

export interface PropertyExpensesResponse {
  totalAmount: number;
  expenses: Expense[];
}

export interface AddExpenseRequest {
  propertyId: string;
  category: string;
  amount: number;
  paymentMode?: ExpensePaymentMode;
  expenseDate: string;
  note?: string;
}

export const addExpense = async (data: AddExpenseRequest) => {
  const response = await api.post("/api/Expenses/add", data);
  return response.data as {
    message: string;
    expenseId: string;
  };
};

export const getPropertyExpenses = async (
  propertyId: string,
  params?: {
    month?: number;
    year?: number;
  }
): Promise<PropertyExpensesResponse> => {
  const response = await api.get(
    `/api/Expenses/property/${propertyId}`,
    { params }
  );

  return response.data;
};

export const deleteExpense = async (expenseId: string) => {
  const response = await api.delete(
    `/api/Expenses/${expenseId}`
  );

  return response.data as {
    message: string;
  };
};