import {
  ArrowDownRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Loader2,
  Plus,
  RefreshCw,
  ReceiptText,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProperties, type Property } from "../../api/properties.api";
import {
  addExpense,
  deleteExpense,
  getPropertyExpenses,
  type Expense,
  type ExpensePaymentMode,
} from "../../api/expenses.api";

const CATEGORIES = [
  "Electricity",
  "Maintenance",
  "Salary",
  "Water",
  "Internet",
  "Other",
] as const;

const PAYMENT_MODES: ExpensePaymentMode[] = [
  "Cash",
  "UPI",
  "Bank Transfer",
  "Other",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getApiError(error: unknown, fallback: string) {
  const candidate = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return candidate?.response?.data?.message || candidate?.message || fallback;
}

function getMonthYear(date: Date) {
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

export default function Expenses() {
  const navigate = useNavigate();

  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const [propertyLoading, setPropertyLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const [form, setForm] = useState({
    category: "Electricity",
    amount: "",
    paymentMode: "Cash" as ExpensePaymentMode,
    expenseDate: now.toISOString().slice(0, 10),
    note: "",
  });

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setPropertyLoading(true);
        setPageError("");

        const response = await getProperties({
          page: 1,
          pageSize: 100,
        });

        const items = response?.items || [];
        setProperties(items);

        if (items.length > 0) {
          setPropertyId((current) => current || items[0].propertyId);
        }
      } catch (error) {
        console.error(error);
        setPageError(getApiError(error, "Unable to load your properties."));
      } finally {
        setPropertyLoading(false);
      }
    };

    void loadProperties();
  }, []);

  useEffect(() => {
    const loadExpenses = async () => {
      if (!propertyId) {
        setExpenses([]);
        setTotalAmount(0);
        return;
      }

      try {
        setLoading(true);
        setPageError("");

        const response = await getPropertyExpenses(propertyId, {
          month,
          year,
        });

        setExpenses(response?.expenses || []);
        setTotalAmount(response?.totalAmount || 0);
      } catch (error) {
        console.error(error);
        setPageError(getApiError(error, "Unable to load expenses."));
      } finally {
        setLoading(false);
      }
    };

    void loadExpenses();
  }, [propertyId, month, year]);

  const selectedProperty = properties.find(
    (property) => property.propertyId === propertyId
  );

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return expenses;

    return expenses.filter((expense) => {
      return [
        expense.category,
        expense.paymentMode,
        expense.note || "",
        expense.expenseDate,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [expenses, search]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();

    expenses.forEach((expense) => {
      map.set(
        expense.category,
        (map.get(expense.category) || 0) + Number(expense.amount || 0)
      );
    });

    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const handleRefresh = async () => {
    if (!propertyId) return;

    try {
      setLoading(true);
      setPageError("");

      const response = await getPropertyExpenses(propertyId, { month, year });
      setExpenses(response?.expenses || []);
      setTotalAmount(response?.totalAmount || 0);
    } catch (error) {
      console.error(error);
      setPageError(getApiError(error, "Unable to refresh expenses."));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      category: "Electricity",
      amount: "",
      paymentMode: "Cash",
      expenseDate: new Date().toISOString().slice(0, 10),
      note: "",
    });
  };

  const handleAddExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!propertyId) {
      setPageError("Please select a property first.");
      return;
    }

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPageError("Please enter a valid expense amount.");
      return;
    }

    if (!form.expenseDate) {
      setPageError("Please select the expense date.");
      return;
    }

    if (form.note.trim().length > 300) {
      setPageError("Expense note cannot be longer than 300 characters.");
      return;
    }

    try {
      setSaving(true);
      setPageError("");
      setSuccessMessage("");

      const response = await addExpense({
        propertyId,
        category: form.category,
        amount,
        paymentMode: form.paymentMode,
        expenseDate: `${form.expenseDate}T00:00:00`,
        note: form.note.trim() || undefined,
      });

      setSuccessMessage(response.message || "Expense added successfully!");
      setShowAddModal(false);
      resetForm();

      const expenseDate = new Date(`${form.expenseDate}T00:00:00`);
      const selectedMonthYear = getMonthYear(expenseDate);

      if (
        selectedMonthYear.month !== month ||
        selectedMonthYear.year !== year
      ) {
        setMonth(selectedMonthYear.month);
        setYear(selectedMonthYear.year);
      } else {
        const refreshed = await getPropertyExpenses(propertyId, {
          month,
          year,
        });
        setExpenses(refreshed?.expenses || []);
        setTotalAmount(refreshed?.totalAmount || 0);
      }
    } catch (error) {
      console.error(error);
      setPageError(getApiError(error, "Unable to add expense."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!deleteTarget) return;

    try {
      setDeletingId(deleteTarget.expenseId);
      setPageError("");
      setSuccessMessage("");

      const response = await deleteExpense(deleteTarget.expenseId);
      setSuccessMessage(response.message || "Expense deleted successfully!");
      setDeleteTarget(null);

      if (propertyId) {
        const refreshed = await getPropertyExpenses(propertyId, {
          month,
          year,
        });
        setExpenses(refreshed?.expenses || []);
        setTotalAmount(refreshed?.totalAmount || 0);
      }
    } catch (error) {
      console.error(error);
      setPageError(getApiError(error, "Unable to delete expense."));
    } finally {
      setDeletingId("");
    }
  };

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      <header className="border-b border-[#E3E6DE] bg-white">
        <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="mb-3 text-xs font-medium text-[#55755A] hover:text-[#1D4435]"
              >
                ← Back to dashboard
              </button>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1D4435] text-white shadow-sm">
                  <ReceiptText className="h-4 w-4" />
                </div>
                <div>
                  <h1 className="text-xl font-medium tracking-tight text-[#294436] sm:text-2xl">
                    Expenses
                  </h1>
                  <p className="mt-0.5 text-xs text-[#859083]">
                    Track property operating costs and protect your real profit number.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative min-w-[220px]">
                <select
                  value={propertyId}
                  onChange={(event) => setPropertyId(event.target.value)}
                  disabled={propertyLoading || properties.length === 0}
                  className="h-10 w-full appearance-none rounded-lg border border-[#DFE4DA] bg-white px-3 pr-8 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92]"
                >
                  {properties.length === 0 && <option value="">No properties</option>}
                  {properties.map((property) => (
                    <option key={property.propertyId} value={property.propertyId}>
                      {property.propertyName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7D887D]" />
              </div>

              <button
                type="button"
                onClick={() => {
                  setSuccessMessage("");
                  setShowAddModal(true);
                }}
                disabled={!propertyId}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add Expense
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {pageError && (
          <div className="mb-4 flex items-start justify-between gap-4 rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] px-3.5 py-3 text-xs font-medium text-[#8A624D]">
            <span>{pageError}</span>
            <button
              type="button"
              onClick={() => setPageError("")}
              className="rounded-lg p-1 hover:bg-[#F7EEDC]"
              aria-label="Dismiss error"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-[#D5E2D5] bg-[#E8EFE8] px-3.5 py-3 text-xs font-medium text-[#356248]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {propertyLoading ? (
          <div className="flex min-h-[350px] items-center justify-center rounded-xl border border-[#E3E6DE] bg-white">
            <div className="text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#7D887D]" />
              <p className="mt-2.5 text-xs font-medium text-[#859083]">
                Loading properties...
              </p>
            </div>
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#DFE4DA] bg-white p-10 text-center">
            <CircleDollarSign className="mx-auto h-9 w-9 text-[#7D887D]" />
            <h2 className="mt-3 text-sm font-medium text-[#294436]">
              No property found
            </h2>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#859083]">
              Create your first property before recording an expense.
            </p>
            <button
              type="button"
              onClick={() => navigate("/onboarding/property")}
              className="mt-4 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white"
            >
              Add Property
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
                    <ReceiptText className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-medium text-[#7D887D]">
                    {monthLabel}
                  </span>
                </div>
                <p className="mt-4 text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                  Total Expenses
                </p>
                <p className="mt-1 text-2xl font-medium tracking-tight text-[#294436]">
                  {formatCurrency(totalAmount)}
                </p>
              </div>

              <div className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F7EEDC] text-[#9B712F]">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <p className="mt-4 text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                  Recorded Entries
                </p>
                <p className="mt-1 text-2xl font-medium tracking-tight text-[#294436]">
                  {expenses.length}
                </p>
              </div>

              <div className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FBF0E9] text-[#A2634B]">
                  <ArrowDownRight className="h-4 w-4" />
                </div>
                <p className="mt-4 text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                  Property
                </p>
                <p className="mt-1 truncate text-lg font-medium tracking-tight text-[#294436]">
                  {selectedProperty?.propertyName || "—"}
                </p>
                <p className="mt-0.5 text-[10px] text-[#859083]">
                  {selectedProperty?.city || ""}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_0.8fr]">
              <section className="rounded-xl border border-[#E3E6DE] bg-white shadow-sm">
                <div className="border-b border-[#EEF0E9] p-4 sm:p-5">
                  <div className="flex flex-col gap-3.5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <h2 className="text-sm font-medium text-[#294436]">
                        Expense Ledger
                      </h2>
                      <p className="mt-0.5 text-[11px] text-[#859083]">
                        {selectedProperty?.propertyName} · {monthLabel}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7D887D]" />
                        <input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Search expense..."
                          className="h-9 w-full rounded-lg border border-[#DFE4DA] pl-8 pr-3 text-xs font-medium outline-none focus:border-[#92AA92] sm:w-48"
                        />
                      </div>

                      <select
                        value={month}
                        onChange={(event) => setMonth(Number(event.target.value))}
                        className="h-9 rounded-lg border border-[#DFE4DA] bg-white px-2.5 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92]"
                      >
                        {Array.from({ length: 12 }, (_, index) => index + 1).map(
                          (value) => (
                            <option key={value} value={value}>
                              {new Date(2026, value - 1, 1).toLocaleDateString(
                                "en-IN",
                                { month: "long" }
                              )}
                            </option>
                          )
                        )}
                      </select>

                      <select
                        value={year}
                        onChange={(event) => setYear(Number(event.target.value))}
                        className="h-9 rounded-lg border border-[#DFE4DA] bg-white px-2.5 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92]"
                      >
                        {Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - 2 + index).map(
                          (value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          )
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#E3E6DE] bg-white px-3 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC] disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="flex min-h-[250px] items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#7D887D]" />
                      <p className="mt-2.5 text-xs text-[#859083]">
                        Loading expenses...
                      </p>
                    </div>
                  </div>
                ) : filteredExpenses.length === 0 ? (
                  <div className="p-8 text-center">
                    <ReceiptText className="mx-auto h-8 w-8 text-[#7D887D]" />
                    <h3 className="mt-3 text-xs font-medium text-[#294436]">
                      No expenses found
                    </h3>
                    <p className="mt-1 text-[11px] text-[#859083]">
                      No expense entries match the selected month or search.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add first expense
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left">
                      <thead>
                        <tr className="border-b border-[#EEF0E9] bg-[#F7F6F0]/60 text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Mode</th>
                          <th className="px-4 py-3">Note</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF0E9]">
                        {filteredExpenses.map((expense) => (
                          <tr
                            key={expense.expenseId}
                            className="text-xs transition-colors hover:bg-[#FAFBF7]"
                          >
                            <td className="px-4 py-3.5">
                              <div className="font-medium text-[#2D4935]">
                                {expense.category}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-[#7D8C75]">
                              {formatDate(expense.expenseDate)}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="rounded-md bg-[#EDF1F3] px-2 py-0.5 text-[9px] font-medium text-[#5C7180]">
                                {expense.paymentMode}
                              </span>
                            </td>
                            <td className="max-w-[200px] truncate px-4 py-3.5 text-[#859083]">
                              {expense.note || "—"}
                            </td>
                            <td className="px-4 py-3.5 text-right font-medium text-[#2D4935]">
                              {formatCurrency(Number(expense.amount || 0))}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(expense)}
                                className="rounded-lg p-1.5 text-[#7D887D] transition hover:bg-[#FBF0E9] hover:text-[#A2634B]"
                                title="Delete expense"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <aside className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm">
                <div>
                  <h2 className="text-sm font-medium text-[#294436]">
                    By Category
                  </h2>
                  <p className="mt-0.5 text-[11px] text-[#859083]">
                    Where this month&apos;s money is going
                  </p>
                </div>

                {categoryBreakdown.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed border-[#DFE4DA] p-5 text-center">
                    <p className="text-xs text-[#859083]">
                      No category data yet.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3.5">
                    {categoryBreakdown.map(([category, amount]) => {
                      const percentage = totalAmount
                        ? Math.round((amount / totalAmount) * 100)
                        : 0;

                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="font-medium text-[#36503E]">
                              {category}
                            </span>
                            <span className="font-medium text-[#294436]">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E8EAE0]">
                            <div
                              className="h-full rounded-full bg-[#1D4435] transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="mt-0.5 text-[10px] text-[#8C9782]">
                            {percentage}% of total expenses
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </aside>
            </div>
          </>
        )}
      </main>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EEF0E9] px-5 py-4">
              <div>
                <h2 className="text-sm font-medium text-[#294436]">
                  Add Expense
                </h2>
                <p className="mt-0.5 text-[10px] text-[#859083]">
                  {selectedProperty?.propertyName || "Selected property"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !saving && setShowAddModal(false)}
                className="rounded-lg p-1.5 text-[#7D887D] hover:bg-[#F2F4EC] hover:text-[#294436]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[#304B35]">
                    Category
                  </span>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none focus:border-[#92AA92]"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[#304B35]">
                    Amount
                  </span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#7D887D]">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.amount}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          amount: event.target.value,
                        }))
                      }
                      placeholder="12500"
                      className="h-10 w-full rounded-lg border border-[#DFE4DA] pl-7 pr-3 text-xs font-medium outline-none focus:border-[#92AA92]"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[#304B35]">
                    Payment Mode
                  </span>
                  <select
                    value={form.paymentMode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        paymentMode: event.target.value as ExpensePaymentMode,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none focus:border-[#92AA92]"
                  >
                    {PAYMENT_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[#304B35]">
                    Expense Date
                  </span>
                  <input
                    type="date"
                    value={form.expenseDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        expenseDate: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-[#DFE4DA] px-3 text-xs font-medium text-[#36503E] outline-none focus:border-[#92AA92]"
                  />
                </label>
              </div>

              <label className="block">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-[#304B35]">Note</span>
                  <span className="text-[10px] text-[#8C9782]">
                    {form.note.length}/300
                  </span>
                </div>
                <textarea
                  value={form.note}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  maxLength={300}
                  rows={3}
                  placeholder="Optional note about this expense..."
                  className="w-full resize-none rounded-lg border border-[#DFE4DA] px-3 py-2 text-xs outline-none focus:border-[#92AA92]"
                />
              </label>

              <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end border-t border-[#EEF0E9] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!saving) {
                      setShowAddModal(false);
                      resetForm();
                    }
                  }}
                  className="h-10 rounded-lg border border-[#E3E6DE] px-4 text-xs font-medium text-[#55755A] hover:bg-[#F2F4EC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-4 text-xs font-medium text-white hover:bg-[#295640] disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {saving ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FBF0E9] text-[#A2634B]">
              <Trash2 className="h-4 w-4" />
            </div>
            <h2 className="mt-4 text-sm font-medium text-[#294436]">
              Delete this expense?
            </h2>
            <p className="mt-1.5 text-xs leading-5 text-[#859083]">
              {deleteTarget.category} · {formatCurrency(Number(deleteTarget.amount || 0))}
              {deleteTarget.note ? ` · ${deleteTarget.note}` : ""}
            </p>
            <p className="mt-2.5 text-[11px] text-[#A2634B]">
              This will remove the expense from the property ledger and affect your expense totals.
            </p>

            <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end border-t border-[#EEF0E9] pt-4">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={Boolean(deletingId)}
                className="h-10 rounded-lg border border-[#E3E6DE] px-4 text-xs font-medium text-[#55755A] hover:bg-[#F2F4EC] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteExpense}
                disabled={Boolean(deletingId)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#A2634B] px-4 text-xs font-medium text-white hover:bg-[#8D543F] disabled:opacity-60"
              >
                {deletingId && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {deletingId ? "Deleting..." : "Delete Expense"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}