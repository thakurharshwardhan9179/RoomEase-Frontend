import { Download, FileSpreadsheet, RefreshCw } from "lucide-react";

import type { Property } from "../../../api/properties.api";
import { exportExpensesCsv } from "../../../api/export.api";
import type { ReportExportRunner } from "../report.types";

export default function ExpensesReport({
  properties,
  propertyId,
  exporting,
  setPropertyId,
  runExport,
}: {
  properties: Property[];
  propertyId: string;
  exporting: string;
  setPropertyId: (value: string) => void;
  runExport: ReportExportRunner;
}) {
  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-center">
        <div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-xl font-extrabold text-slate-900">
            Expense report
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Choose a property and export the recorded expenses exposed by the current backend.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Property
          </label>

          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-500"
          >
            <option value="">Select property</option>
            {properties.map((property) => (
              <option
                key={property.propertyId}
                value={property.propertyId}
              >
                {property.propertyName}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={!propertyId || Boolean(exporting)}
            onClick={() =>
              void runExport(
                "expenses-report",
                () => exportExpensesCsv(propertyId),
                "Expenses CSV downloaded."
              )
            }
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white disabled:opacity-50"
          >
            {exporting === "expenses-report" ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export Expenses CSV
          </button>
        </div>
      </div>
    </section>
  );
}
