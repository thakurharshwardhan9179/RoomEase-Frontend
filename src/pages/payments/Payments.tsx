import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, IndianRupee, History } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  getTenants, 
  markPaymentPaid, 
  getPaymentHistory, 
  type Tenant, 
  type Payment 
} from "../../api/tenants.api";

export default function RecordPayment() {
  const { tenantId } = useParams();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "UPI" | "Bank Transfer">("UPI");
  const [forMonth, setForMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    totalExpected: number;
    totalPaid: number;
    balanceDue: number;
    status: string;
  } | null>(null);

  // Load Tenant Details & Payment History
  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      setHistoryLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setHistoryLoading(true);
        setError("");

        // 1. Fetch Tenants List
        const data: any = await getTenants({ page: 1, pageSize: 100 });
        
        // Handle different backend response formats (array vs paginated object)
        const tenantList: Tenant[] = Array.isArray(data) 
          ? data 
          : data?.items || data?.data || [];

        const found = tenantList.find((t) => t.tenantId === tenantId);
        
        if (found) {
          setTenant(found);
          setAmountPaid(String(found.balanceDue > 0 ? found.balanceDue : found.totalRent || 0));
        } else {
          setError("Tenant record could not be located.");
        }

        // 2. Fetch Payment History safely
        try {
          const historyData: any = await getPaymentHistory(tenantId);
          setPayments(Array.isArray(historyData) ? historyData : historyData?.items || []);
        } catch (historyErr) {
          console.error("Error loading payment history:", historyErr);
          setPayments([]);
        }
      } catch (err: any) {
        console.error("Error loading payment data:", err);
        setError(err?.response?.data?.message || "Unable to load tenant details.");
      } finally {
        setLoading(false);
        setHistoryLoading(false);
      }
    };

    loadData();
  }, [tenantId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const amount = Number(amountPaid);
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!tenantId) return;

    try {
      setSubmitting(true);
      const response = await markPaymentPaid({
        tenantId,
        amountPaid: amount,
        paymentMode,
        forMonth,
      });
      setResult(response.data);

      // Refresh payment history after successful payment
      const updatedHistory: any = await getPaymentHistory(tenantId);
      setPayments(Array.isArray(updatedHistory) ? updatedHistory : updatedHistory?.items || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F0] p-12 text-center text-xs text-[#7D887D]">
        Loading tenant data...
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-[#F7F6F0] p-8 text-center">
        <div className="mx-auto max-w-md rounded-xl border border-[#E3E6DE] bg-white p-6 shadow-sm">
          <p className="font-medium text-[#294436]">Tenant not found</p>
          <p className="mt-1 text-xs text-[#859083]">
            {error || "The requested tenant profile could not be loaded."}
          </p>
          <button
            onClick={() => navigate("/tenants")}
            className="mt-4 rounded-lg bg-[#1D4435] px-4 py-2 text-xs font-medium text-white hover:bg-[#295640]"
          >
            Back to Tenants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      <header className="border-b border-[#E3E6DE] bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
          <button
            onClick={() => navigate(`/tenants/${tenantId}`)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#55755A] transition hover:text-[#1D4435]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {tenant.fullName}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          
          {/* LEFT COLUMN: Record Payment Form */}
          <div className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8EFE8] text-[#356248]">
                <IndianRupee className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-medium text-[#294436]">Record a Payment</h2>
              <p className="mt-0.5 text-xs text-[#859083]">
                Current balance due: ₹{(tenant.balanceDue || 0).toLocaleString("en-IN")}
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-[#E7D4C7] bg-[#FBF0E9] px-3.5 py-3 text-xs font-medium text-[#8A624D]">
                {error}
              </div>
            )}

            {result ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#D5E2D5] bg-[#E8EFE8] p-4 text-center">
                  <p className="text-xs font-medium text-[#356248]">Payment recorded successfully!</p>
                  <p className="mt-2 text-[11px] text-[#356248]/90">Total expected: ₹{result.totalExpected.toLocaleString("en-IN")}</p>
                  <p className="mt-1 text-[11px] text-[#356248]/90">Total paid: ₹{result.totalPaid.toLocaleString("en-IN")}</p>
                  <p className="mt-2 text-sm font-medium text-[#294436]">Balance: ₹{result.balanceDue.toLocaleString("en-IN")} ({result.status})</p>
                </div>
                <button
                  onClick={() => setResult(null)}
                  className="flex h-10 w-full items-center justify-center rounded-lg bg-[#1D4435] text-xs font-medium text-white transition hover:bg-[#295640]"
                >
                  Record Another Payment
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-medium text-[#304B35]">Amount paid</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-[#304B35]">Payment mode</label>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {(["Cash", "UPI", "Bank Transfer"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                          paymentMode === mode
                            ? "border-[#1D4435] bg-[#1D4435] text-white shadow-sm"
                            : "border-[#E3E6DE] bg-white text-[#40543E] hover:border-[#C7D3C7]"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-[#304B35]">For month</label>
                  <input
                    type="date"
                    value={forMonth}
                    onChange={(e) => setForMonth(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 flex h-10 w-full items-center justify-center rounded-lg bg-[#1D4435] text-xs font-medium text-white transition hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Recording..." : "Mark as Paid"}
                </button>
              </form>
            )}
          </div>

          {/* RIGHT COLUMN: Payment History */}
          <div className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-[#294436]">Payment History</h2>
                <p className="mt-0.5 text-xs text-[#859083]">Previous transactions for {tenant.fullName}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F2F4EC] text-[#55755A]">
                <History className="h-4 w-4" />
              </div>
            </div>

            {historyLoading ? (
              <div className="py-12 text-center text-xs text-[#7D887D]">
                Loading payment history...
              </div>
            ) : payments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#DFE4DA] p-6 text-center">
                <p className="text-xs font-medium text-[#294436]">No payments recorded yet</p>
                <p className="mt-0.5 text-[10px] text-[#859083]">Past transactions will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {payments.map((payment) => (
                  <div
                    key={payment.paymentId}
                    className="flex items-center justify-between rounded-lg border border-[#E4E8DE] bg-[#F7F6F0]/60 p-3.5 transition hover:bg-white"
                  >
                    <div>
                      <p className="text-xs font-medium text-[#294436]">
                        ₹{payment.amountPaid.toLocaleString("en-IN")}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#859083]">
                        Mode: <span className="font-medium">{payment.paymentMode}</span> · Paid on: {new Date(payment.paidOn).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <span className="rounded-md bg-[#E8EFE8] px-2 py-0.5 text-[9px] font-medium text-[#356248]">
                      Successful
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}