import {
  Download,
  RefreshCw,
  WalletCards,
} from "lucide-react";

import {
  exportPaymentsCsv,
} from "../../../api/export.api";

import type { Tenant } from "../../../api/tenants.api";

import ReportEmptyState from "../components/ReportEmptyState";

import type {
  ReportExportRunner,
} from "../report.types";

interface PaymentsReportProps {
  tenants: Tenant[];
  tenantId: string;
  exporting: string;
  setTenantId: (
    value: string
  ) => void;
  runExport: ReportExportRunner;
}

export default function PaymentsReport({
  tenants,
  tenantId,
  exporting,
  setTenantId,
  runExport,
}: PaymentsReportProps) {
  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-center">
        {/* LEFT */}
        <div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
            <WalletCards className="h-5 w-5" />
          </div>

          <h2 className="mt-4 text-xl font-extrabold text-slate-900">
            Payment Report
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Choose a tenant and export the payment history
            currently exposed by the backend.
          </p>
        </div>

        {/* RIGHT */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Tenant
          </label>

          <select
            value={tenantId}
            onChange={(event) =>
              setTenantId(
                event.target.value
              )
            }
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-500"
          >
            <option value="">
              Select tenant
            </option>

            {tenants.map((tenant) => (
              <option
                key={tenant.tenantId}
                value={tenant.tenantId}
              >
                {tenant.fullName}
                {" — "}
                {tenant.mobileNumber}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={
              !tenantId ||
              Boolean(exporting)
            }
            onClick={() =>
              void runExport(
                "payments-report",
                () =>
                  exportPaymentsCsv(
                    tenantId
                  ),
                "Payments CSV downloaded."
              )
            }
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ===
            "payments-report" ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}

            Export Payments CSV
          </button>
        </div>
      </div>

      {tenants.length === 0 && (
        <div className="mt-6">
          <ReportEmptyState
            label="No tenant records available."
          />
        </div>
      )}
    </section>
  );
}