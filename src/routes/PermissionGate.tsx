import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { getOwner } from "../utils/session";

export default function PermissionGate({
  anyOf,
  moduleCode,
  children,
}: {
  anyOf: string[];
  moduleCode?: string;
  children: ReactNode;
}) {
  const owner = getOwner();
  if (!owner.accessLoaded) {
    return <div className="p-6 text-sm text-slate-500">Loading account access…</div>;
  }
  const hasPermission = owner.userType !== "TeamUser" || anyOf.some((permission) => owner.permissions?.includes(permission));
  const hasModule = !moduleCode || owner.modules?.some((module) => module.code === moduleCode);
  const allowed = hasPermission && hasModule;
  if (allowed) return children;

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
      <h1 className="text-lg font-bold">You don’t have access to this page</h1>
      <p className="mt-1 text-sm text-amber-800">Ask the account owner to update your role permissions.</p>
      <Link to="/dashboard" className="mt-4 inline-flex rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white">Back to dashboard</Link>
    </div>
  );
}
