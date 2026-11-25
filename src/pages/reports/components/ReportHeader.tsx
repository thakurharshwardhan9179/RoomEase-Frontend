import type { ReactNode } from "react";

import { ArrowLeft, RefreshCw } from "lucide-react";

interface ReportHeaderProps {
  icon: ReactNode;
  title: string;
  description: string;
  onBack: () => void;
  onRefresh: () => void;
  loading?: boolean;
}

export default function ReportHeader({
  icon,
  title,
  description,
  onBack,
  onRefresh,
  loading = false,
}: ReportHeaderProps) {
  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Reports
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Refresh report
        </button>
      </div>

      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
            {icon}
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Reports
            </p>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              {title}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
