import { useEffect, useState } from "react";
import { saApi, saError } from "../api";

const blank = { code: "", displayName: "", description: "", moduleCode: "" };

export default function Permissions() {
  const [search, setSearch] = useState("");
  const [moduleCode, setModule] = useState("");
  const [includeInactive, setInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState(blank);
  const [edit, setEdit] = useState<any>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await saApi.permissions({
      search: search || undefined,
      moduleCode: moduleCode || undefined,
      includeInactive,
      page,
      pageSize: 50,
    });
    setResult(r);
  }

  useEffect(() => {
    load().catch((e) => setError(saError(e)));
  }, [search, moduleCode, includeInactive, page]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setToast("");
    try {
      if (edit) {
        await saApi.updatePermission(edit.permissionCatalogItemId, {
          displayName: form.displayName,
          description: form.description || null,
          moduleCode: form.moduleCode || null,
        });
      } else {
        await saApi.createPermission({
          ...form,
          moduleCode: form.moduleCode || null,
          description: form.description || null,
        });
      }
      setToast(edit ? "Permission updated." : "Permission created.");
      setForm(blank);
      setEdit(null);
      await load();
    } catch (x) {
      setError(saError(x));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#2C4136] antialiased">
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 space-y-6">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#55755A]">
              Platform control
            </p>
            <h1 className="mt-1 text-xl font-medium tracking-tight text-[#294436] sm:text-2xl">
              Permission catalog
            </h1>
            <p className="mt-0.5 text-xs text-[#859083]">
              Create and maintain permission codes available to client teams.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 rounded-lg border border-[#E3E6DE] bg-white px-3.5 py-2 text-xs font-medium text-[#40543E] shadow-sm cursor-pointer hover:bg-[#F2F4EC]">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setInactive(e.target.checked)}
              className="h-4 w-4 rounded border-[#DFE4DA] text-[#1D4435] focus:ring-[#E3EADF]"
            />
            Include inactive
          </label>
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

        {/* ADD / EDIT FORM CARD */}
        <section className="rounded-xl border border-[#E3E6DE] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between border-b border-[#EEF0E9] pb-4 mb-4">
            <h3 className="text-xs font-medium text-[#294436]">
              {edit ? `Edit ${edit.code}` : "Add permission"}
            </h3>
            {edit && (
              <button
                type="button"
                className="rounded-lg border border-[#E3E6DE] bg-white px-3 py-1.5 text-xs font-medium text-[#55755A] hover:bg-[#F2F4EC]"
                onClick={() => {
                  setEdit(null);
                  setForm(blank);
                }}
              >
                Cancel edit
              </button>
            )}
          </div>

          <form className="grid gap-3.5 sm:grid-cols-2" onSubmit={save}>
            {!edit && (
              <input
                className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
                required
                placeholder="Permission code e.g. BILLING.READ"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            )}
            <input
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
              required
              placeholder="Display name"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
            <input
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
              placeholder="Module code (optional)"
              value={form.moduleCode}
              onChange={(e) => setForm({ ...form, moduleCode: e.target.value })}
            />
            <input
              className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-[#F7F6F0]/50 px-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:bg-white focus:ring-4 focus:ring-[#E3EADF]"
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <button
              type="submit"
              disabled={busy}
              className="sm:col-span-2 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#1D4435] px-4 text-xs font-medium text-white shadow-sm transition hover:bg-[#295640] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Saving…" : edit ? "Save changes" : "Create permission"}
            </button>
          </form>
        </section>

        {/* FILTERS */}
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:ring-4 focus:ring-[#E3EADF]"
            placeholder="Search code or display name"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <input
            className="h-10 w-full rounded-lg border border-[#DFE4DA] bg-white px-3 text-xs font-medium text-[#36503E] outline-none transition placeholder:text-[#8C9782] focus:border-[#92AA92] focus:ring-4 focus:ring-[#E3EADF]"
            placeholder="Filter module code"
            value={moduleCode}
            onChange={(e) => {
              setPage(1);
              setModule(e.target.value);
            }}
          />
        </div>

        {/* TABLE WRAPPER */}
        <div className="overflow-hidden rounded-xl border border-[#E3E6DE] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#EEF0E9] bg-[#F7F6F0]/60 text-[9px] font-medium uppercase tracking-[0.12em] text-[#7D887D]">
                  <th className="px-4 py-3">Permission</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF0E9]">
                {result?.items?.map((p: any) => (
                  <tr key={p.permissionCatalogItemId} className="text-xs transition-colors hover:bg-[#FAFBF7]">
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-[#294436]">{p.displayName}</span>
                      <small className="block text-[10px] text-[#8C9782] mt-0.5">{p.code}</small>
                    </td>
                    <td className="px-4 py-3.5 text-[#36503E] font-medium">{p.moduleCode || "Global"}</td>
                    <td className="px-4 py-3.5 text-[#859083]">{p.description || "—"}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-medium ${
                          p.isActive
                            ? "bg-[#E8EFE8] text-[#356248]"
                            : "bg-[#FBF0E9] text-[#A2634B]"
                        }`}
                      >
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          className="rounded-lg border border-[#E3E6DE] bg-white px-2.5 py-1 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC]"
                          onClick={() => {
                            setEdit(p);
                            setForm({
                              code: p.code,
                              displayName: p.displayName,
                              description: p.description || "",
                              moduleCode: p.moduleCode || "",
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                            p.isActive
                              ? "border border-[#E7D4C7] bg-white text-[#A2634B] hover:bg-[#FBF0E9]"
                              : "bg-[#1D4435] text-white hover:bg-[#295640]"
                          }`}
                          onClick={async () => {
                            try {
                              await saApi.permissionStatus(p.permissionCatalogItemId, !p.isActive);
                              await load();
                            } catch (x) {
                              setError(saError(x));
                            }
                          }}
                        >
                          {p.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!result && (
            <div className="py-12 text-center text-xs text-[#7D887D]">
              Loading permissions…
            </div>
          )}
          {result?.items?.length === 0 && (
            <div className="py-12 text-center text-xs text-[#859083]">
              No permissions found.
            </div>
          )}

          {/* PAGINATION */}
          <div className="flex items-center justify-between border-t border-[#EEF0E9] px-4 py-3 text-xs text-[#859083]">
            <span>
              {result?.totalCount || 0} permissions · page {page}
            </span>
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                className="rounded-lg border border-[#E3E6DE] bg-white px-3 py-1.5 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC] disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded-lg border border-[#E3E6DE] bg-white px-3 py-1.5 text-xs font-medium text-[#40543E] hover:bg-[#F2F4EC] disabled:opacity-40"
                disabled={!result || result.items.length < 50}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}