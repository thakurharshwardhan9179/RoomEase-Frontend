import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  IndianRupee,
  Loader2,
  LogOut,
  Pencil,
  Phone,
  RefreshCw,
  ShieldCheck,
  Upload,
  WalletCards,
  Trash2,
} from "lucide-react";

import {
  checkoutTenant,
  getPaymentHistory,
  getTenants,
  settleRefund,
  type CheckoutResult,
  type Payment,
  type Tenant,
  updateTenant,
} from "../../api/tenants.api";

import api from "../../api/axios";
import {
  getTenantDocuments,
  uploadTenantDocument,
  deleteTenantDocument,
  type TenantDocument,
} from "../../api/tenantDocuments.api";

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function date(value?: string | null) {
  if (!value) return "—";

  const d = new Date(value);

  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function isoDate(value?: string | null) {
  return value
    ? new Date(value).toISOString().slice(0, 10)
    : "";
}

function getInitials(name?: string) {
  if (!name?.trim()) return "TN";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
}

function getStatusStyle(status?: string) {
  switch (status) {
    case "Paid":
      return {
        label: "Paid",
        classes:
          "bg-[#E8EFE8] text-[#356248] border border-[#D5E2D5]",
        dot: "bg-[#356248]",
      };

    case "DueSoon":
      return {
        label: "Due Soon",
        classes:
          "bg-[#F7EEDC] text-[#9B712F] border border-[#F7EEDC]",
        dot: "bg-[#9B712F]",
      };

    case "Overdue":
      return {
        label: "Overdue",
        classes:
          "bg-[#FBF0E9] text-[#A2634B] border border-[#E7D4C7]",
        dot: "bg-[#A2634B]",
      };

    case "Upcoming":
      return {
        label: "Upcoming",
        classes:
          "bg-[#EDF1F3] text-[#5C7180] border border-[#DFE4DA]",
        dot: "bg-[#5C7180]",
      };

    default:
      return {
        label: status || "Active",
        classes:
          "bg-[#F2F4EC] text-[#40543E] border border-[#E3E6DE]",
        dot: "bg-[#7D887D]",
      };
  }
}

export default function TenantDetail() {
  const { tenantId } = useParams();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [documents, setDocuments] = useState<TenantDocument[]>(
    [],
  );

  const [loadingDocuments, setLoadingDocuments] =
    useState(false);
  const [uploading, setUploading] = useState(false);
  const [openingDocId, setOpeningDocId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [docError, setDocError] = useState<string>("");

  const [documentType, setDocumentType] =
    useState("AadharCard");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [settling, setSettling] = useState(false);
  const [actualAmount, setActualAmount] = useState("");
  const [settlementNote, setSettlementNote] =
    useState("");

  const [checkout, setCheckout] =
    useState<CheckoutResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingOut, setCheckingOut] =
    useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [showCheckout, setShowCheckout] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    mobileNumber: "",
    depositAmount: "",
    agreementEndDate: "",
  });

  const load = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const tenantData = await getTenants({
        page: 1,
        pageSize: 1000,
      });

      const found = tenantData.items.find(
        (item) => item.tenantId === tenantId,
      );

      if (!found) {
        setTenant(null);
        setError(
          "Tenant was not found or is no longer active.",
        );
        return;
      }

      setTenant(found);

      setForm({
        fullName: found.fullName,
        mobileNumber: found.mobileNumber,
        depositAmount: String(
          found.depositAmount ?? "",
        ),
        agreementEndDate: isoDate(
          found.agreementEndDate,
        ),
      });

      try {
        setPayments(
          await getPaymentHistory(tenantId),
        );
      } catch {
        setPayments([]);
      }

      try {
        setLoadingDocuments(true);

        setDocuments(
          await getTenantDocuments(tenantId),
        );
      } catch {
        setDocuments([]);
      } finally {
        setLoadingDocuments(false);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to load tenant profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [tenantId]);

  const initials = useMemo(
    () => getInitials(tenant?.fullName),
    [tenant],
  );

  const paidThisMonth = payments.reduce(
    (sum, p) =>
      sum + (p.isVoided ? 0 : p.amountPaid),
    0,
  );

  const statusStyle = getStatusStyle(
    tenant?.status,
  );

  const saveChanges = async () => {
    if (!tenantId) return;

    if (
      !form.fullName.trim() ||
      form.mobileNumber.length !== 10
    ) {
      setError(
        "Enter a valid name and 10 digit mobile number.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      await updateTenant(tenantId, {
        fullName: form.fullName.trim(),
        mobileNumber: form.mobileNumber,
        depositAmount: Number(
          form.depositAmount || 0,
        ),
        agreementEndDate: form.agreementEndDate
          ? `${form.agreementEndDate}T00:00:00`
          : null,
      });

      setShowEdit(false);
      setSuccess(
        "Tenant details updated successfully.",
      );

      await load();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to update tenant.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = async () => {
    if (!tenantId) return;

    try {
      setCheckingOut(true);
      setError("");

      const result = await checkoutTenant(
        tenantId,
      );

      setCheckout(result.data);

      setActualAmount(
        String(
          result.data.settlementType === "Refund"
            ? result.data.refundableAmount
            : result.data.amountDueFromTenant,
        ),
      );

      setSettlementNote("");
      setShowCheckout(false);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to checkout tenant.",
      );
    } finally {
      setCheckingOut(false);
    }
  };

  const uploadDocument = async () => {
    if (!tenantId || !selectedFile) return;

    if (
      ![
        "application/pdf",
        "image/jpeg",
        "image/png",
      ].includes(selectedFile.type)
    ) {
      setError(
        "Only JPG, PNG and PDF files are supported.",
      );
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError(
        "File size must be 5 MB or less.",
      );
      return;
    }

    try {
      setUploading(true);
      setError("");

      await uploadTenantDocument(
        tenantId,
        documentType,
        selectedFile,
      );

      setSelectedFile(null);

      const input = document.getElementById(
        "tenant-doc-file",
      ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      setDocuments(
        await getTenantDocuments(tenantId),
      );

      setSuccess(
        "Tenant document uploaded successfully.",
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to upload tenant document.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      setDeletingDocId(docId);
      setDocError("");
      await deleteTenantDocument(docId);
      if (tenantId) {
        setDocuments(await getTenantDocuments(tenantId));
      }
      setSuccess("Document deleted successfully.");
    } catch (err: any) {
      setDocError(err?.response?.data?.message || "Unable to delete document.");
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleViewDocument = async (doc: TenantDocument) => {
    if (!doc.fileUrl) return;
    try {
      setOpeningDocId(doc.tenantDocumentId);
      setDocError("");

      const response = await api.get(doc.fileUrl, {
        responseType: "blob",
      });

      const rawContentType = response.headers["content-type"];
      const contentType =
        typeof rawContentType === "string"
          ? rawContentType
          : "application/octet-stream";
      const blob = new Blob([response.data], {
        type: contentType,
      });
      const objectUrl = window.URL.createObjectURL(blob);

      const disposition = response.headers["content-disposition"];
      let filename = `${doc.documentType || "document"}`;
      if (disposition && typeof disposition === "string") {
        const match = disposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, "").trim();
        }
      }

      const popup = window.open(objectUrl, "_blank");
      if (!popup) {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      window.setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 60000);
    } catch (err: any) {
      console.error("Failed to load document:", err);
      setDocError(
        err?.response?.data?.message ||
          "Unable to open document. Please try again.",
      );
    } finally {
      setOpeningDocId(null);
    }
  };

  const completeSettlement = async () => {
    if (!checkout) return;

    const amount = Number(actualAmount);

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      setError(
        "Enter a valid settlement amount.",
      );
      return;
    }

    try {
      setSettling(true);
      setError("");

      await settleRefund(checkout.tenantId, {
        actualAmount: amount,
        note:
          settlementNote.trim() || undefined,
      });

      setCheckout({
        ...checkout,
        settlementStatus: "Settled",
        settledAmount: amount,
        settledAt: new Date().toISOString(),
        settlementNote:
          settlementNote.trim() || null,
      });

      setSuccess(
        "Settlement marked as complete.",
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to complete settlement.",
      );
    } finally {
      setSettling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F0] p-6 lg:p-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-24 rounded-xl bg-white" />
          <div className="h-56 rounded-xl bg-[#E3E6DE]" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-32 rounded-xl bg-white"
                />
              ),
            )}
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="h-96 rounded-xl bg-white" />
            <div className="h-96 rounded-xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-[#F7F6F0] p-6">
        <div className="mx-auto max-w-xl rounded-xl border border-[#E3E6DE] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FBF0E9] text-[#A2634B]">
            <AlertCircle className="h-6 w-6" />
          </div>

          <h1 className="mt-4 text-sm font-medium text-[#294436]">
            Tenant not available
          </h1>

          <p className="mt-1 text-xs text-[#859083]">
            {error ||
              "The requested tenant could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/tenants")}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#1D4435] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#295640]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tenants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 space-y-6">
        
        {/* TOP BAR */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/tenants")}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#55755A] hover:text-[#1D4435]"
          >
            <ArrowLeft className="h-4 w-4" />
            Tenants
          </button>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E3E6DE] bg-white px-3 py-1.5 text-xs font-medium text-[#40543E] shadow-sm hover:bg-[#F2F4EC]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] p-4 text-xs text-[#8A624D]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Something needs attention</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-xl border border-[#D5E2D5] bg-[#E8EFE8] p-4 text-xs text-[#356248]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Changes saved</p>
              <p className="mt-0.5">{success}</p>
            </div>
          </div>
        )}

        {/* HERO */}
        <section className="relative overflow-hidden rounded-xl bg-[#1D4435] text-white shadow-md p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(85,117,90,0.3),_transparent_42%)]" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-sm font-medium text-white backdrop-blur sm:h-16 sm:w-16">
                {initials}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-medium tracking-tight text-white sm:text-2xl">
                    {tenant.fullName}
                  </h1>

                  <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-medium text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Active tenant
                  </span>
                </div>

                <a
                  href={`tel:${tenant.mobileNumber}`}
                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-[#C4D0C5] transition hover:text-white"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {tenant.mobileNumber}
                </a>

                <div className="mt-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[9px] font-medium ring-1 ${statusStyle.classes}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                    />
                    {statusStyle.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowEdit(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-medium text-[#1D4435] transition hover:bg-[#F2F4EC]"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/tenants/${tenantId}/pay`,
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/20"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Payment
              </button>

              <button
                type="button"
                onClick={() => setShowCheckout(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3.5 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20"
              >
                <LogOut className="h-3.5 w-3.5" />
                Checkout
              </button>
            </div>
          </div>
        </section>

        {/* FINANCIAL SUMMARY */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Monthly rent"
            value={money(tenant.totalRent)}
            icon={
              <IndianRupee className="h-4 w-4" />
            }
          />

          <Stat
            label="Balance due"
            value={money(tenant.balanceDue)}
            valueClass={
              tenant.balanceDue > 0
                ? "text-[#A2634B]"
                : "text-[#356248]"
            }
            icon={
              <WalletCards className="h-4 w-4" />
            }
          />

          <Stat
            label="Advance credit"
            value={money(
              tenant.advanceBalance || 0,
            )}
            icon={
              <CreditCard className="h-4 w-4" />
            }
          />

          <Stat
            label="Paid this month"
            value={money(paidThisMonth)}
            valueClass="text-[#356248]"
            icon={
              <CheckCircle2 className="h-4 w-4" />
            }
          />
        </section>

        {/* ASSIGNMENTS + PAYMENTS */}
        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          {/* ASSIGNMENTS */}
          <section className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                  Accommodation
                </p>

                <h2 className="mt-1 text-sm font-medium text-[#294436]">
                  Current assignments
                </h2>

                <p className="mt-0.5 text-xs text-[#859083]">
                  Every active bed assigned to this tenant.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/tenants/${tenantId}/manage-rooms`,
                  )
                }
                className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[#E3E6DE] bg-white px-3 py-2 text-xs font-medium text-[#40543E] transition hover:bg-[#F2F4EC]"
              >
                <BedDouble className="h-3.5 w-3.5" />
                Manage beds
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {tenant.rooms.length ? (
                tenant.rooms.map((room) => (
                  <div
                    key={room.bedId}
                    className="flex flex-col gap-3 rounded-lg border border-[#E4E8DE] bg-[#F7F6F0]/60 p-3.5 transition hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#55755A] shadow-sm">
                        <BedDouble className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-[#294436]">
                          {room.propertyName}
                        </p>

                        <p className="mt-0.5 text-[11px] text-[#859083]">
                          Room {room.roomNumber} · Bed{" "}
                          {room.bedNumber}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-[9px] font-medium uppercase tracking-wider text-[#7D887D]">
                        Agreed rent
                      </p>

                      <p className="mt-0.5 text-xs font-medium text-[#294436]">
                        {money(room.agreedRent)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-[#DFE4DA] p-6 text-center">
                  <BedDouble className="mx-auto h-5 w-5 text-[#7D887D]" />

                  <p className="mt-2 text-xs font-medium text-[#294436]">
                    No current assignments
                  </p>

                  <p className="mt-0.5 text-[10px] text-[#859083]">
                    This tenant currently has no active bed assignment.
                  </p>
                </div>
              )}
            </div>

            {/* PROFILE DATES */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Info
                label="Joining date"
                value={date(tenant.joiningDate)}
                icon={
                  <CalendarDays className="h-3.5 w-3.5" />
                }
              />

              <Info
                label="Agreement end"
                value={date(
                  tenant.agreementEndDate,
                )}
                icon={
                  <Clock3 className="h-3.5 w-3.5" />
                }
              />

              <Info
                label="Deposit"
                value={money(
                  tenant.depositAmount || 0,
                )}
                icon={
                  <WalletCards className="h-3.5 w-3.5" />
                }
              />

              <Info
                label="Next due"
                value={date(tenant.nextDueDate)}
                icon={
                  <CreditCard className="h-3.5 w-3.5" />
                }
              />
            </div>
          </section>

          {/* PAYMENTS */}
          <section className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                  Collections
                </p>

                <h2 className="mt-1 text-sm font-medium text-[#294436]">
                  Recent payments
                </h2>

                <p className="mt-0.5 text-xs text-[#859083]">
                  Latest payment history from the backend.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/tenants/${tenantId}/pay`,
                  )
                }
                className="inline-flex items-center gap-1 text-xs font-medium text-[#356248] hover:text-[#1D4435]"
              >
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {payments.slice(0, 5).map(
                (payment) => (
                  <div
                    key={payment.paymentId}
                    className="rounded-lg border border-[#E4E8DE] bg-[#F7F6F0]/60 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-[#294436]">
                          {money(
                            payment.amountPaid,
                          )}
                        </p>

                        <p className="mt-0.5 text-[10px] text-[#859083]">
                          {payment.paymentMode} ·{" "}
                          {date(payment.paidOn)}
                        </p>
                      </div>

                      <span
                        className={`rounded-md px-2 py-0.5 text-[9px] font-medium ${
                          payment.isVoided
                            ? "bg-[#EDF1F3] text-[#5C7180]"
                            : "bg-[#E8EFE8] text-[#356248]"
                        }`}
                      >
                        {payment.isVoided
                          ? "Voided"
                          : "Recorded"}
                      </span>
                    </div>
                  </div>
                ),
              )}

              {payments.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#DFE4DA] bg-[#F7F6F0]/50 p-8 text-center">
                  <CreditCard className="mx-auto h-5 w-5 text-[#7D887D]" />

                  <p className="mt-2 text-xs font-medium text-[#294436]">
                    No payments recorded yet
                  </p>

                  <p className="mt-0.5 text-[10px] text-[#859083]">
                    Payment history will appear here after a collection is recorded.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/tenants/${tenantId}/pay`,
                      )
                    }
                    className="mt-3.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#295640]"
                  >
                    Record first payment
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* KYC */}
        <section className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                Verification
              </p>

              <h2 className="mt-1 text-sm font-medium text-[#294436]">
                Tenant documents / KYC
              </h2>

              <p className="mt-0.5 text-xs text-[#859083]">
                JPG, PNG or PDF · maximum 5 MB per file.
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8EFE8] text-[#356248]">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_auto]">
            <select
              value={documentType}
              onChange={(e) =>
                setDocumentType(e.target.value)
              }
              className="h-10 rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition focus:border-[#92AA92] focus:bg-white"
            >
              <option>AadharCard</option>
              <option>PanCard</option>
              <option>DrivingLicense</option>
              <option>Other</option>
            </select>

            <input
              id="tenant-doc-file"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) =>
                setSelectedFile(
                  e.target.files?.[0] || null,
                )
              }
              className="h-10 rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 py-1.5 text-xs text-[#36503E] outline-none"
            />

            <button
              type="button"
              onClick={() =>
                void uploadDocument()
              }
              disabled={
                uploading || !selectedFile
              }
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-4 text-xs font-medium text-white transition hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}

              Upload
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {docError && (
              <div className="rounded-lg border border-[#E7D4C7] bg-[#FBF0E9] p-3 text-xs text-[#8A624D]">
                {docError}
              </div>
            )}
            {loadingDocuments ? (
              <div className="flex items-center justify-center rounded-xl bg-[#F7F6F0] p-6">
                <Loader2 className="h-4 w-4 animate-spin text-[#7D887D]" />
              </div>
            ) : documents.length ? (
              documents.map((doc) => (
                <div
                  key={doc.tenantDocumentId}
                  className="flex flex-col gap-3 rounded-lg border border-[#E4E8DE] bg-[#F7F6F0]/60 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#7D887D] shadow-sm">
                      <ShieldCheck className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs font-medium text-[#294436]">
                        {doc.documentType}
                      </p>

                      <p className="mt-0.5 text-[10px] text-[#859083]">
                        Uploaded{" "}
                        {date(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-[#F7EEDC] px-2 py-0.5 text-[9px] font-medium text-[#9B712F]">
                      {doc.verificationStatus}
                    </span>

                    {doc.fileUrl && (
                      <button
                        type="button"
                        disabled={openingDocId === doc.tenantDocumentId}
                        onClick={() => void handleViewDocument(doc)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E3E6DE] bg-white px-2.5 py-1.5 text-xs font-medium text-[#40543E] transition hover:bg-[#F2F4EC] disabled:opacity-50"
                      >
                        {openingDocId === doc.tenantDocumentId ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Opening...
                          </>
                        ) : (
                          <>
                            Open
                            <ExternalLink className="h-3 w-3" />
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={deletingDocId === doc.tenantDocumentId}
                      onClick={() => void handleDeleteDocument(doc.tenantDocumentId)}
                      className="inline-flex items-center justify-center rounded-lg border border-[#E3E6DE] bg-white p-1.5 text-xs text-[#7D887D] transition hover:bg-[#FBF0E9] hover:text-[#A2634B] disabled:opacity-50"
                      title="Delete document"
                    >
                      {deletingDocId === doc.tenantDocumentId ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#A2634B]" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[#DFE4DA] p-6 text-center">
                <ShieldCheck className="mx-auto h-5 w-5 text-[#7D887D]" />

                <p className="mt-2 text-xs font-medium text-[#294436]">
                  No tenant documents uploaded
                </p>

                <p className="mt-0.5 text-[10px] text-[#859083]">
                  Upload KYC documents from the panel above.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ACTIONS */}
        <section className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-1.5">
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
              Quick actions
            </p>

            <h2 className="text-sm font-medium text-[#294436]">
              Tenant actions
            </h2>

            <p className="text-xs text-[#859083]">
              Common operational actions for this resident.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Action
              title="Record payment"
              description="Post a new rent collection for this tenant."
              onClick={() =>
                navigate(
                  `/tenants/${tenantId}/pay`,
                )
              }
            />

            <Action
              title="Manage rooms"
              description="Add another bed or transfer the current assignment."
              onClick={() =>
                navigate(
                  `/tenants/${tenantId}/manage-rooms`,
                )
              }
            />

            <Action
              title="Checkout tenant"
              description="Complete settlement and release all active assignments."
              onClick={() =>
                setShowCheckout(true)
              }
              danger
            />
          </div>

          {tenant.whatsappLink && (
            <div className="mt-4 flex justify-end">
              <a
                href={tenant.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#356248] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-[#1D4435]"
              >
                WhatsApp tenant
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </section>
      </div>

      {/* EDIT MODAL */}
      {showEdit && (
        <Modal
          title="Edit tenant"
          onClose={() => setShowEdit(false)}
        >
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Full name">
              <input
                value={form.fullName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    fullName:
                      e.target.value,
                  })
                }
              />
            </Field>

            <Field label="Mobile number">
              <input
                inputMode="numeric"
                maxLength={10}
                value={form.mobileNumber}
                onChange={(e) =>
                  setForm({
                    ...form,
                    mobileNumber:
                      e.target.value.replace(
                        /\D/g,
                        "",
                      ),
                  })
                }
              />
            </Field>

            <Field label="Deposit amount">
              <input
                type="number"
                min="0"
                value={form.depositAmount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    depositAmount:
                      e.target.value,
                  })
                }
              />
            </Field>

            <Field label="Agreement end date">
              <input
                type="date"
                value={form.agreementEndDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    agreementEndDate:
                      e.target.value,
                  })
                }
              />
            </Field>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-[#EEF0E9] pt-4">
            <button
              type="button"
              onClick={() =>
                setShowEdit(false)
              }
              className="rounded-lg px-3.5 py-2 text-xs font-medium text-[#55755A] hover:bg-[#F2F4EC]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() =>
                void saveChanges()
              }
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white disabled:opacity-60"
            >
              {saving && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}

              Save changes
            </button>
          </div>
        </Modal>
      )}

      {/* CHECKOUT CONFIRMATION */}
      {showCheckout && (
        <Modal
          title="Confirm checkout"
          onClose={() => setShowCheckout(false)}
        >
          <div className="rounded-lg border border-[#F7EEDC] bg-[#F7EEDC]/60 p-3.5">
            <p className="text-xs font-medium text-[#9B712F]">
              Confirm tenant checkout?
            </p>

            <p className="mt-1 text-[11px] text-[#9B712F]/90">
              This will close the tenant's active assignments and calculate the final rent settlement.
            </p>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-[#EEF0E9] pt-4">
            <button
              type="button"
              onClick={() =>
                setShowCheckout(false)
              }
              className="rounded-lg px-3.5 py-2 text-xs font-medium text-[#55755A] hover:bg-[#F2F4EC]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() =>
                void handleCheckout()
              }
              disabled={checkingOut}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#A2634B] px-3.5 py-2 text-xs font-medium text-white disabled:opacity-60"
            >
              {checkingOut && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}

              Confirm checkout
            </button>
          </div>
        </Modal>
      )}

      {/* CHECKOUT SETTLEMENT */}
      {checkout && (
        <Modal
          title="Checkout settlement"
          onClose={() => {
            setCheckout(null);
            navigate("/tenants");
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat
              label="Total expected rent"
              value={money(
                checkout.totalExpectedRent,
              )}
            />

            <Stat
              label="Total paid"
              value={money(
                checkout.totalPaid,
              )}
            />

            <Stat
              label="Outstanding"
              value={money(
                checkout.outstandingRentBalance,
              )}
              valueClass={
                checkout.outstandingRentBalance >
                0
                  ? "text-[#A2634B]"
                  : "text-[#356248]"
              }
            />

            <Stat
              label="Advance"
              value={money(
                checkout.advanceBalance,
              )}
            />
          </div>

          <div
            className={`mt-4 rounded-lg p-3.5 text-xs ${
              checkout.settlementType ===
              "Refund"
                ? "bg-[#E8EFE8] text-[#356248] border border-[#D5E2D5]"
                : "bg-[#FBF0E9] text-[#8A624D] border border-[#E7D4C7]"
            }`}
          >
            <p className="font-medium">
              {checkout.settlementType ===
              "Refund"
                ? `Refund ${money(
                    checkout.refundableAmount,
                  )}`
                : `Amount due ${money(
                    checkout.amountDueFromTenant,
                  )}`}
            </p>

            <p className="mt-0.5 text-[10px]">
              Settlement status:{" "}
              {checkout.settlementStatus ||
                "Pending"}
            </p>
          </div>

          {checkout.settlementStatus ===
          "Settled" ? (
            <div className="mt-4 rounded-lg border border-[#D5E2D5] bg-[#E8EFE8] p-3.5 text-xs">
              <p className="font-medium text-[#356248]">
                Settlement completed:{" "}
                {money(
                  checkout.settledAmount || 0,
                )}
              </p>

              <button
                type="button"
                onClick={() => {
                  setCheckout(null);
                  navigate("/tenants");
                }}
                className="mt-3 w-full rounded-lg bg-[#1D4435] px-3 py-2 text-xs font-medium text-white hover:bg-[#295640]"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="mt-4">
                <Field
                  label={
                    checkout.settlementType ===
                    "Refund"
                      ? "Actual refund given"
                      : "Actual amount received"
                  }
                >
                  <input
                    type="number"
                    min="0"
                    value={actualAmount}
                    onChange={(e) =>
                      setActualAmount(
                        e.target.value,
                      )
                    }
                  />
                </Field>
              </div>

              <div className="mt-3">
                <Field label="Settlement note">
                  <input
                    maxLength={300}
                    value={settlementNote}
                    onChange={(e) =>
                      setSettlementNote(
                        e.target.value,
                      )
                    }
                    placeholder="Optional note"
                  />
                </Field>
              </div>

              <button
                type="button"
                onClick={() =>
                  void completeSettlement()
                }
                disabled={settling}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#356248] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#1D4435] disabled:opacity-60"
              >
                {settling && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}

                Mark settlement complete
              </button>

              <button
                type="button"
                onClick={() => {
                  setCheckout(null);
                  navigate("/tenants");
                }}
                className="mt-2 w-full rounded-lg border border-[#E3E6DE] px-3.5 py-2 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC]"
              >
                Do later
              </button>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  valueClass = "text-[#294436]",
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
        {icon}
        {label}
      </div>

      <p
        className={`mt-2 text-xl font-medium tracking-tight ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#E4E8DE] bg-[#F7F6F0]/60 p-3.5">
      <div className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
        {icon}
        {label}
      </div>

      <p className="mt-1.5 text-xs font-medium text-[#294436]">
        {value}
      </p>
    </div>
  );
}

function Action({
  title,
  description,
  onClick,
  danger = false,
}: {
  title: string;
  description: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
        danger
          ? "border-[#E7D4C7] bg-[#FBF0E9]/60 hover:bg-[#FBF0E9]"
          : "border-[#E3E6DE] bg-[#F7F6F0]/60 hover:border-[#C7D3C7] hover:bg-white"
      }`}
    >
      <p
        className={`text-xs font-medium ${
          danger
            ? "text-[#A2634B]"
            : "text-[#294436]"
        }`}
      >
        {title}
      </p>

      <p className="mt-0.5 text-[11px] text-[#859083]">
        {description}
      </p>
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[#304B35]">
        {label}
      </span>

      <div className="mt-1.5 [&>input]:h-10 [&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:border-[#DFE4DA] [&>input]:bg-[#F7F6F0]/50 [&>input]:px-3 [&>input]:text-xs [&>input]:font-medium [&>input]:text-[#36503E] [&>input]:outline-none [&>input]:focus:border-[#92AA92] [&>input]:focus:bg-white [&>input]:focus:ring-4 [&>input]:focus:ring-[#E3EADF]">
        {children}
      </div>
    </label>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between gap-4 border-b border-[#EEF0E9] pb-4">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
              RoomEase
            </p>

            <h2 className="mt-0.5 text-sm font-medium text-[#294436]">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#7D887D] transition hover:bg-[#F2F4EC] hover:text-[#294436]"
          >
            ×
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}