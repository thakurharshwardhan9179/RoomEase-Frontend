import { ArrowUpRight, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { Property } from "../../../api/properties.api";
import ReportEmptyState from "../components/ReportEmptyState";

export default function PropertyReport({
  properties,
}: {
  properties: Property[];
}) {
  const navigate = useNavigate();

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Property Directory
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Click any property to open its full property detail page.
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {properties.length} properties
        </span>
      </div>

      {properties.length === 0 ? (
        <ReportEmptyState label="No properties found." />
      ) : (
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          {properties.map((property) => (
            <button
              key={property.propertyId}
              type="button"
              onClick={() =>
                navigate(`/properties/${property.propertyId}`)
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                  <Building2 className="h-5 w-5" />
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-indigo-600">
                  Open
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>

              <h3 className="mt-4 text-sm font-extrabold text-slate-900">
                {property.propertyName}
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                {property.city}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <span>{property.propertyType}</span>
                <span>View details</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
