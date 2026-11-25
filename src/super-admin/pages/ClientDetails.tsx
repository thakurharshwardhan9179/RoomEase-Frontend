import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { saApi, saError } from "../api";

export default function ClientDetails() {
  const { ownerId = "" } = useParams();
  const [client, setClient] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [settings, setSettings] = useState<any[]>([]);
  const [permissionCatalog, setPermissionCatalog] = useState<any[]>([]);
  const [permissionValues, setPermissionValues] = useState<Record<string, boolean>>({});
  const [savedPermissionValues, setSavedPermissionValues] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [limitValues, setLimitValues] = useState<Record<string, string>>({});
  const [setting, setSetting] = useState({ category: "", key: "", value: "", valueType: "string" });

  const load = useCallback(async () => {
    const [c, p, s, permissionResult] = await Promise.all([
      saApi.client(ownerId),
      saApi.plans(),
      saApi.settings(ownerId),
      saApi.permissions({ page: 1, pageSize: 100, includeInactive: false }),
    ]);
    setClient(c);
    setPlans(p);
    setSettings(s);

    // Permission catalog defines the available permission codes.
    // AccountSettings stores each client's value under category="permissions".
    const catalogItems = permissionResult?.items ?? [];
    setPermissionCatalog(catalogItems);
    console.log("Permission catalog loaded:", catalogItems.length);

alert(
  "Permission API loaded: " + catalogItems.length +
  "\nFirst permission: " + (catalogItems[0]?.code || "No data")
);

    const permissionSettings = (Array.isArray(s) ? s : []).filter(
      (item: any) => String(item.category || "").toLowerCase() === "permissions"
    );
    const savedValues: Record<string, boolean> = {};
    for (const item of permissionSettings) {
      savedValues[String(item.key)] = String(item.value).toLowerCase() === "true";
    }

    const currentValues: Record<string, boolean> = {};
    for (const permission of catalogItems) {
      currentValues[permission.code] = savedValues[permission.code] ?? false;
    }
    setSavedPermissionValues(currentValues);
    setPermissionValues(currentValues);

    setSelectedPlanId(p.find((plan: any) => plan.code === c.subscription?.planCode)?.planId || "");
  }, [ownerId]);

  useEffect(() => {
    load().catch((e) => setError(saError(e)));
  }, [load]);

  async function run(action: () => Promise<any>, message?: string) {
    setError("");
    setToast("");
    setBusy(true);
    try {
      const r = await action();
      setToast(message || r.message || "Changes saved.");
      await load();
    } catch (e) {
      setError(saError(e));
    } finally {
      setBusy(false);
    }
  }

  async function savePermissions() {
    const changedPermissions = permissionCatalog.filter(
      (permission) =>
        Boolean(permissionValues[permission.code]) !==
        Boolean(savedPermissionValues[permission.code])
    );

    if (changedPermissions.length === 0) {
      setToast("All client permissions are already up to date.");
      setError("");
      return;
    }

    setError("");
    setToast("");
    setBusy(true);
    try {
      // The existing backend endpoint saves one category/key/value setting per request.
      for (const permission of changedPermissions) {
        await saApi.saveSetting(
          ownerId,
          "permissions",
          permission.code,
          String(Boolean(permissionValues[permission.code])),
          "boolean"
        );
      }

      setToast(`${changedPermissions.length} permission(s) saved successfully.`);
      await load();
    } catch (e) {
      setError(saError(e));
      // Reload to reflect any settings that may have been saved before a failed request.
      try {
        await load();
      } catch {
        // Keep the original save error visible.
      }
    } finally {
      setBusy(false);
    }
  }

  async function savePlan() {
    if (!selectedPlanId) {
      setError("Select an active plan first.");
      return;
    }
    if (selectedPlanId === plans.find((plan) => plan.code === client.subscription?.planCode)?.planId) {
      setToast("This client is already on the selected plan.");
      setError("");
      return;
    }

    setError("");
    setToast("");
    setBusy(true);
    try {
      const response = await saApi.changePlan(ownerId, selectedPlanId);
      setToast(response?.message || "Client plan changed successfully.");
      try {
        const updatedClient = await saApi.client(ownerId);
        setClient(updatedClient);
        setSelectedPlanId(
          plans.find((plan) => plan.code === updatedClient.subscription?.planCode)?.planId || selectedPlanId,
        );
      } catch {
        setError("Plan was saved, but client details could not be refreshed. Reload this page to confirm the current plan.");
      }
    } catch (e) {
      setError(saError(e));
    } finally {
      setBusy(false);
    }
  }

  async function overrideModule(m: any) {
    const raw = prompt(`Reason for changing ${m.name} access?`, reason);
    if (raw === null) return;
    setReason(raw);
    await run(() => saApi.module(ownerId, m.moduleId, !m.isEnabled, raw));
  }

  async function changeLimit(l: any) {
    const raw = limitValues[l.code] ?? String(l.value);
    const unlimited = raw.toLowerCase() === "unlimited";
    const value = unlimited ? undefined : Number(raw);
    if (!unlimited && (value === undefined || !Number.isInteger(value) || value < 0)) {
      setError("Enter a whole number or type unlimited.");
      return;
    }
    const why = prompt(`Reason for changing the ${l.code} limit?`, reason);
    if (why === null) return;
    setReason(why);
    await run(() => saApi.limit(ownerId, l.code, value, unlimited, why));
  }

  async function ghostLogin() {
    if (!confirm(`Start a 4-hour ghost login as ${client.fullName}? This will switch the current RoomEase owner session.`)) return;
    setBusy(true);
    try {
      const r = await saApi.impersonate(ownerId);
      localStorage.setItem("roomease_pre_impersonation_token", localStorage.getItem("roomease_token") || "");
      localStorage.setItem("roomease_pre_impersonation_owner", localStorage.getItem("roomease_owner") || "");
      localStorage.setItem("roomease_impersonation_owner_id", ownerId);
      localStorage.setItem("roomease_token", r.token);
      localStorage.setItem("roomease_owner", JSON.stringify({ ownerId: r.ownerId, fullName: client.fullName }));
      location.assign("/dashboard");
    } catch (e) {
      setError(saError(e));
      setBusy(false);
    }
  }

  if (error && !client) return <div className="sa-error">{error}</div>;
  if (!client) return <div className="sa-loading">Loading client account…</div>;

  const sub = client.subscription;

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 space-y-6">
        
        <Link to="/super-admin/clients" className="sa-back">← Back to clients</Link>
        
        {/* PAGE HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
              Platform control
            </p>
            <h1 className="mt-1 text-xl font-medium tracking-tight text-[#294436] sm:text-2xl">
              {client.fullName}
            </h1>
            <p className="mt-0.5 text-xs text-[#859083]">
              {client.mobileNumber} · {client.isMobileVerified ? "Mobile verified" : "Mobile not verified"} · ID {client.ownerId}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E3E6DE] bg-white px-3.5 py-2 text-xs font-medium text-[#40543E] shadow-sm hover:bg-[#F2F4EC] disabled:opacity-60"
              disabled={busy}
              onClick={ghostLogin}
            >
              Start ghost login
            </button>
            {sub?.status === "Suspended" ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4435] px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#295640] disabled:opacity-60"
                disabled={busy}
                onClick={() => run(() => saApi.reactivate(ownerId))}
              >
                Reactivate client
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7D4C7] bg-[#FBF0E9] px-3.5 py-2 text-xs font-medium text-[#A2634B] hover:bg-[#F7EEDC] disabled:opacity-60"
                disabled={busy || !sub}
                onClick={() => confirm("Suspend this client's subscription?") && run(() => saApi.suspend(ownerId))}
              >
                Suspend client
              </button>
            )}
          </div>
        </div>

        {toast && (
          <div className="rounded-xl border border-[#D5E2D5] bg-[#E8EFE8] px-4 py-3 text-xs font-medium text-[#356248]">
            {toast}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-[#E7D4C7] bg-[#FBF0E9] px-4 py-3 text-xs font-medium text-[#8A624D]">
            {error}
          </div>
        )}

        {/* DETAIL STATS GRID */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
            <small className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">Subscription status</small>
            <b className="mt-2 block text-base font-medium text-[#294436]">{sub?.status || "Not configured"}</b>
          </div>
          <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
            <small className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">Current plan</small>
            <b className="mt-2 block text-base font-medium text-[#294436]">{sub?.planName || "—"}</b>
          </div>
          <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
            <small className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">Plan period ends</small>
            <b className="mt-2 block text-base font-medium text-[#294436]">
              {sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : "—"}
            </b>
          </div>
          <div className="rounded-xl border border-[#E3E6DE] bg-white p-4 shadow-sm">
            <small className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">Trial ends</small>
            <b className="mt-2 block text-base font-medium text-[#294436]">
              {sub?.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString() : "—"}
            </b>
          </div>
        </section>

        {/* RESPONSIVE TWO COLUMNS (Stacked on mobile to prevent cramping) */}
        <div className="grid gap-5 xl:grid-cols-2">
          
          <section className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6 space-y-4">
            <div className="border-b border-[#EEF0E9] pb-3">
              <h3 className="text-xs font-medium text-[#294436]">Subscription & plan</h3>
            </div>
            
            <div className="flex flex-col gap-3 py-2 border-b border-[#EEF0E9] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <b className="text-xs font-medium text-[#294436]">Change plan</b>
                <small className="text-[11px] text-[#859083] block">Assign an active platform plan</small>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="h-10 min-w-40 rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none focus:border-[#92AA92] disabled:opacity-60"
                  value={selectedPlanId}
                  disabled={busy}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                >
                  <option value="">Select plan</option>
                  {plans.filter((p) => p.isActive).map((p) => (
                    <option value={p.planId} key={p.planId}>{p.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-[#1D4435] px-4 text-xs font-medium text-white shadow-sm hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={busy || !selectedPlanId}
                  onClick={() => void savePlan()}
                >
                  {busy ? "Saving…" : "Save plan"}
                </button>
              </div>
            </div>

            <div>
              <b className="text-xs font-medium text-[#294436]">Account usage</b>
              <small className="text-[11px] text-[#859083]">Current active resource counts</small>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Object.entries(client.usage || {}).map(([k, v]) => (
                <div className="rounded-lg border border-[#E3E6DE] bg-[#F7F6F0]/60 p-3" key={k}>
                  <small className="block text-[9px] font-medium uppercase tracking-wider text-[#7D887D] mb-1">{k}</small>
                  <b className="text-xs font-medium text-[#294436]">{String(v)}</b>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6 space-y-4">
            <div className="border-b border-[#EEF0E9] pb-3">
              <h3 className="text-xs font-medium text-[#294436]">Account settings</h3>
            </div>

            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => saApi.saveSetting(ownerId, setting.category, setting.key, setting.value, setting.valueType), "Account setting saved.");
              }}
            >
              <input
                className="h-10 rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none focus:border-[#92AA92]"
                placeholder="Category"
                required
                value={setting.category}
                onChange={(e) => setSetting({ ...setting, category: e.target.value })}
              />
              <input
                className="h-10 rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none focus:border-[#92AA92]"
                placeholder="Key"
                required
                value={setting.key}
                onChange={(e) => setSetting({ ...setting, key: e.target.value })}
              />
              <input
                className="h-10 rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none focus:border-[#92AA92]"
                placeholder="Value"
                required
                value={setting.value}
                onChange={(e) => setSetting({ ...setting, value: e.target.value })}
              />
              <select
                className="h-10 rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none focus:border-[#92AA92]"
                value={setting.valueType}
                onChange={(e) => setSetting({ ...setting, valueType: e.target.value })}
              >
                {["string", "number", "boolean", "json"].map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
              <button
                type="submit"
                className="sm:col-span-2 inline-flex h-10 items-center justify-center rounded-lg bg-[#1D4435] px-4 text-xs font-medium text-white shadow-sm hover:bg-[#295640] disabled:opacity-60"
                disabled={busy}
              >
                Save account setting
              </button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {settings.map((s: any) => (
                <div className="rounded-lg border border-[#E3E6DE] bg-[#F7F6F0]/60 p-3 text-xs" key={s.accountSettingId}>
                  <b className="font-medium text-[#294436] mb-0.5 block">{s.category} / {s.key}</b>
                  <span className="text-[#859083] break-all">{s.value} · {s.valueType}</span>
                </div>
              ))}
              {settings.length === 0 && (
                <span className="text-xs text-[#859083] block py-2">No account settings yet.</span>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6 space-y-4">
            <div className="flex flex-col gap-2 border-b border-[#EEF0E9] pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xs font-medium text-[#294436]">Client permissions</h3>
                <p className="mt-1 text-[11px] text-[#859083]">
                  Enable or disable catalog permissions for this client only.
                </p>
              </div>
              <span className="text-[10px] text-[#859083]">
                {permissionCatalog.length} available
              </span>
            </div>

            {permissionCatalog.length > 0 ? (
              <>
                <div className="space-y-1">
                  {permissionCatalog.map((permission: any) => (
                    <div
                      key={permission.permissionCatalogItemId || permission.code}
                      className="flex items-center justify-between gap-4 border-b border-[#EEF0E9] py-3 last:border-0"
                    >
                      <div className="min-w-0">
                        <b className="block text-xs font-medium text-[#294436]">
                          {permission.displayName || permission.code}
                        </b>
                        <small className="mt-0.5 block text-[10px] text-[#859083]">
                          {permission.code}
                          {permission.moduleCode ? ` · ${permission.moduleCode}` : " · Global"}
                        </small>
                        {permission.description && (
                          <p className="mt-1 text-[11px] text-[#859083]">
                            {permission.description}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(permissionValues[permission.code])}
                        aria-label={`Enable ${permission.displayName || permission.code}`}
                        className={`sa-switch shrink-0 ${permissionValues[permission.code] ? "on" : ""}`}
                        disabled={busy}
                        onClick={() =>
                          setPermissionValues((current) => ({
                            ...current,
                            [permission.code]: !current[permission.code],
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 border-t border-[#EEF0E9] pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[10px] text-[#859083]">
                    {permissionCatalog.filter((p: any) => permissionValues[p.code]).length} enabled · Changes are pending until saved.
                  </span>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1D4435] px-4 text-xs font-medium text-white shadow-sm hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={busy || !permissionCatalog.some((p: any) =>
                      Boolean(permissionValues[p.code]) !== Boolean(savedPermissionValues[p.code])
                    )}
                    onClick={() => void savePermissions()}
                  >
                    {busy ? "Saving…" : "Save permissions"}
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-lg bg-[#F7F6F0]/70 px-3 py-4 text-xs text-[#859083]">
                No active permissions found in the permission catalog. Add and activate permissions from the Permission Catalog page first.
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6 space-y-4">
            <div className="border-b border-[#EEF0E9] pb-3">
              <h3 className="text-xs font-medium text-[#294436]">Module access</h3>
            </div>
            <div className="space-y-3">
              {client.modules?.map((m: any) => (
                <div className="flex items-center justify-between gap-4 py-2 border-b border-[#EEF0E9] last:border-0" key={m.moduleId}>
                  <div>
                    <b className="text-xs font-medium text-[#294436]">{m.name}</b>
                    <small className="text-[11px] text-[#859083] block mt-0.5">
                      {m.code} · {m.overrideValue === null ? `Plan ${m.isIncludedInPlan ? "includes" : "does not include"} module` : `Override ${m.overrideValue ? "enabled" : "disabled"}`}
                    </small>
                  </div>
                  <button
                    type="button"
                    className={`sa-switch ${m.isEnabled ? "on" : ""}`}
                    aria-label={`Toggle ${m.name}`}
                    disabled={busy}
                    onClick={() => overrideModule(m)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6 space-y-4">
            <div className="border-b border-[#EEF0E9] pb-3">
              <h3 className="text-xs font-medium text-[#294436]">Quota limits</h3>
            </div>
            <div className="space-y-3">
              {client.limits?.map((l: any) => (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-[#EEF0E9] last:border-0" key={l.code}>
                  <div>
                    <b className="text-xs font-medium text-[#294436]">{l.code}</b>
                    <small className="text-[11px] text-[#859083] block mt-0.5">
                      {l.description || "Account resource limit"} · currently {l.unlimited ? "Unlimited" : l.value}
                    </small>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      className="h-9 w-28 rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none focus:border-[#92AA92]"
                      aria-label={`${l.code} value`}
                      value={limitValues[l.code] ?? (l.unlimited ? "unlimited" : l.value)}
                      onChange={(e) => setLimitValues({ ...limitValues, [l.code]: e.target.value })}
                    />
                    <button
                      type="button"
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1D4435] px-3 text-xs font-medium text-white shadow-sm hover:bg-[#295640] disabled:opacity-60"
                      disabled={busy}
                      onClick={() => changeLimit(l)}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
