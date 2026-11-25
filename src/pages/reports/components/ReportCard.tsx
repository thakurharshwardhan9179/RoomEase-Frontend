import type { ReportCardDefinition } from "../report.types";

interface ReportCardProps {
  report: ReportCardDefinition;
  liveCount: string;
  onClick: () => void;
}

export default function ReportCard({
  report,
  liveCount,
  onClick,
}: ReportCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-h-[172px] w-full flex-col justify-between rounded-3xl border p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${report.tone}`}
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition duration-200 group-hover:scale-110">
            {report.icon}
          </div>

          <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 shadow-sm">
            Active
          </span>
        </div>

        <h3 className="mt-4 text-base font-extrabold tracking-tight">
          {report.title}
        </h3>

        <p className="mt-1 text-xs leading-relaxed opacity-80">
          {report.description}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-3 text-xs font-bold opacity-90">
        <span>{liveCount}</span>

        <span className="transition-transform duration-200 group-hover:translate-x-1">
          →
        </span>
      </div>
    </button>
  );
}
