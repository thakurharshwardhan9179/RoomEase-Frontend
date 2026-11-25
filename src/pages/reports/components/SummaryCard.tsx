import type { ReactNode } from "react";

interface SummaryCardProps {
  label: string;
  value: number | string;
  helper: string;
  icon: ReactNode;
  onClick?: () => void;
}

export default function SummaryCard({
  label,
  value,
  helper,
  icon,
  onClick,
}: SummaryCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </span>

        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </span>
      </div>

      <p className="mt-3 text-2xl font-black text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-[11px] font-semibold text-slate-400">
        {helper}
      </p>
    </>
  );

  if (!onClick) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      {content}
    </button>
  );
}