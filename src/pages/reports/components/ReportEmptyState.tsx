import { CheckCircle2 } from "lucide-react";

export default function ReportEmptyState({
  label,
}: {
  label: string;
}) {
  return (
    <div className="p-12 text-center">
      <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300" />

      <p className="mt-3 text-sm font-extrabold text-slate-900">
        {label}
      </p>
    </div>
  );
}