import { Download, RefreshCw, UserRound, WalletCards } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import type { Property } from "../../../api/properties.api";
import type { Tenant } from "../../../api/tenants.api";
import ReportEmptyState from "../components/ReportEmptyState";
import type { ReportExportRunner } from "../report.types";

export default function TenantReport({
  tenants,
  properties,
  propertyId,
  exporting,
  setPropertyId,
  runExport,
}: {
  tenants: Tenant[];
  properties: Property[];
  propertyId: string;
  exporting: string;
  setPropertyId: (value: string) => void;
  runExport: ReportExportRunner;
}) {
  const navigate = useNavigate();

  const tenantItems = tenants.filter((tenant) => {
    if (!propertyId) return true;
    const item = tenant as Tenant & { propertyId?: string };
    return !item.propertyId || item.propertyId === propertyId;
  });

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
            Tenant data
          </p>
          <h2 className="mt-1 text-lg font-extrabold text-slate-900">
            Current Tenants
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Click a tenant to open the existing tenant detail page.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="">All properties</option>
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
            disabled={Boolean(exporting)}
            onClick={() =>
              void runExport(
                "tenant-report",
                () =>
                  import("../../../api/export.api").then((api) =>
                    api.exportTenantsCsv(
                      propertyId || undefined
                    )
                  ),
                "Tenants CSV downloaded."
              )
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white disabled:opacity-50"
          >
            {exporting === "tenant-report" ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid gap-4 border-b border-slate-100 p-5 sm:grid-cols-3 sm:p-6">
        <MetricCard
          label="Tenants"
          value={tenantItems.length}
          icon={<UserRound className="h-4 w-4" />}
        />
        <MetricCard
          label="Properties"
          value={properties.length}
          icon={<WalletCards className="h-4 w-4" />}
        />
        <MetricCard
          label="Selected property"
          value={propertyId ? 1 : properties.length}
          icon={<UserRound className="h-4 w-4" />}
        />
      </div>

      {tenantItems.length === 0 ? (
        <ReportEmptyState label="No tenants found." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-5 py-4">Tenant</th>
                <th className="px-5 py-4">Mobile</th>
                <th className="px-5 py-4">Balance</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenantItems.map((tenant) => {
                const item = tenant as Tenant & {
                  balanceDue?: number;
                  depositAmount?: number;
                };

                return (
                  <tr
                    key={tenant.tenantId}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/tenants/${tenant.tenantId}`)
                        }
                        className="text-left text-sm font-extrabold text-slate-900 hover:text-indigo-600"
                      >
                        {tenant.fullName}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {tenant.mobileNumber}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-800">
                      {item.balanceDue !== undefined
                        ? `₹${Number(item.balanceDue || 0).toLocaleString("en-IN")}`
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/tenants/${tenant.tenantId}`)
                        }
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        View Tenant
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-2 text-2xl font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}