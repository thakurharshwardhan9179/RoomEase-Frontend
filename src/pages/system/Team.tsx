import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, CirclePlus, Edit3, LoaderCircle, Search, ShieldCheck, UserCog, UserPlus, Users, X } from "lucide-react";
import { getApiErrorMessage } from "../../api/axios";
import { teamApi, type AccountRole, type AccountTeamUser, type TeamPermission } from "../../api/team.api";
import { getOwner } from "../../utils/session";

type Tab = "members" | "roles";
const emptyRole = { name: "", permissions: [] as string[] };
const emptyUser = { fullName: "", mobileNumber: "", password: "", accountRoleId: "" };

export default function Team() {
  const account = getOwner();
  const isTeamUser = account.userType === "TeamUser";
  const held = new Set(account.permissions || []);
  const canReadUsers = !isTeamUser || held.has("TEAM.USERS.READ");
  const canCreateUsers = !isTeamUser || held.has("TEAM.USERS.CREATE");
  const canUpdateUsers = !isTeamUser || held.has("TEAM.USERS.UPDATE");
  const canReadRoles = !isTeamUser || held.has("TEAM.ROLES.READ");
  const canCreateRoles = !isTeamUser || held.has("TEAM.ROLES.CREATE");
  const canUpdateRoles = !isTeamUser || held.has("TEAM.ROLES.UPDATE");

  const [users, setUsers] = useState<AccountTeamUser[]>([]);
  const [roles, setRoles] = useState<AccountRole[]>([]);
  const [catalog, setCatalog] = useState<TeamPermission[]>([]);
  const [tab, setTab] = useState<Tab>(canReadUsers ? "members" : "roles");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [roleModal, setRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<AccountRole | null>(null);
  const [roleForm, setRoleForm] = useState(emptyRole);
  const [memberModal, setMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState(emptyUser);

  const canOpenMembers = canReadUsers;
  const canOpenRoles = canReadRoles;

  async function loadTeam() {
    setLoading(true);
    setError("");
    const tasks: Promise<unknown>[] = [
      canReadUsers ? teamApi.getUsers() : Promise.resolve([]),
      canReadRoles ? teamApi.getRoles() : Promise.resolve([]),
      canReadRoles ? teamApi.getAssignablePermissions() : Promise.resolve([]),
    ];
    const results = await Promise.allSettled(tasks);
    const failures = results.filter((result) => result.status === "rejected");
    if (results[0].status === "fulfilled") setUsers(results[0].value as AccountTeamUser[]);
    if (results[1].status === "fulfilled") setRoles(results[1].value as AccountRole[]);
    if (results[2].status === "fulfilled") setCatalog(results[2].value as TeamPermission[]);
    if (failures.length) setError(getApiErrorMessage((failures[0] as PromiseRejectedResult).reason));
    setLoading(false);
  }

  useEffect(() => { void loadTeam(); }, []);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || user.fullName.toLowerCase().includes(term) || user.mobileNumber.includes(term) || user.roleName.toLowerCase().includes(term);
    const matchesStatus = status === "all" || (status === "active" && user.isActive) || (status === "inactive" && !user.isActive);
    return matchesSearch && matchesStatus;
  }), [users, search, status]);

  const groupedPermissions = useMemo(() => catalog.reduce<Record<string, TeamPermission[]>>((groups, permission) => {
    const key = permission.moduleCode || "GENERAL";
    (groups[key] ||= []).push(permission);
    return groups;
  }, {}), [catalog]);

  async function saveRole(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError(""); setToast("");
    try {
      if (editingRole) await teamApi.updateRole(editingRole.accountRoleId, roleForm);
      else await teamApi.createRole(roleForm);
      setToast(editingRole ? "Role and permissions updated." : "Role created.");
      setRoleModal(false); setEditingRole(null); setRoleForm(emptyRole);
      await loadTeam();
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setSaving(false); }
  }

  async function saveMember(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError(""); setToast("");
    try {
      await teamApi.createUser(memberForm);
      setToast("Team member added. Share their mobile number and password securely.");
      setMemberModal(false); setMemberForm(emptyUser);
      await loadTeam();
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setSaving(false); }
  }

  async function toggleMember(user: AccountTeamUser) {
    const action = user.isActive ? "deactivate" : "activate";
    if (!confirm(`${action === "deactivate" ? "Deactivate" : "Activate"} ${user.fullName}'s team access?`)) return;
    setError(""); setToast(""); setSaving(true);
    try {
      await teamApi.updateUserStatus(user.accountUserId, { isActive: !user.isActive });
      setToast(`${user.fullName}'s access was ${user.isActive ? "deactivated" : "activated"}.`);
      await loadTeam();
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setSaving(false); }
  }

  function openCreateRole() { setEditingRole(null); setRoleForm(emptyRole); setRoleModal(true); }
  function openEditRole(role: AccountRole) { setEditingRole(role); setRoleForm({ name: role.name, permissions: [...role.permissions] }); setRoleModal(true); }
  function togglePermission(code: string) {
    setRoleForm((current) => ({ ...current, permissions: current.permissions.includes(code) ? current.permissions.filter((item) => item !== code) : [...current.permissions, code] }));
  }

  const noManagementAccess = isTeamUser && !canReadUsers && !canReadRoles;
  if (noManagementAccess) return <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900"><ShieldCheck className="mb-3"/><h1 className="text-lg font-bold">Team settings are restricted</h1><p className="mt-1 text-amber-800">Your {account.roleName || "team"} role doesn’t include permission to view team members or roles.</p></div>;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-700">Workspace access</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Team & permissions</h1><p className="mt-1 text-sm text-slate-500">Add teammates and choose exactly what each role can access.</p></div>
        <div className="flex gap-2">
          {tab === "roles" && canCreateRoles && <button type="button" onClick={openCreateRole} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><CirclePlus size={16}/> Create role</button>}
          {canCreateUsers && canReadRoles && <button type="button" onClick={() => { setMemberForm({ ...emptyUser, accountRoleId: roles[0]?.accountRoleId || "" }); setMemberModal(true); }} disabled={!roles.length} className="inline-flex items-center gap-2 rounded-lg bg-[#1D4435] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#163629] disabled:opacity-50"><UserPlus size={16}/> Add team member</button>}
        </div>
      </div>

      {toast && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><Check size={16}/>{toast}</div>}
      {error && <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertCircle size={17}/>{error}<button className="ml-auto font-semibold underline" onClick={() => void loadTeam()}>Retry</button></div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Users size={15}/> Team members</div><p className="mt-2 text-2xl font-bold text-slate-900">{users.length}</p><p className="mt-1 text-[11px] text-slate-400">{users.filter((user) => user.isActive).length} active</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><ShieldCheck size={15}/> Roles</div><p className="mt-2 text-2xl font-bold text-slate-900">{roles.length}</p><p className="mt-1 text-[11px] text-slate-400">Includes default and custom roles</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><UserCog size={15}/> Your access</div><p className="mt-2 text-lg font-bold text-slate-900">{isTeamUser ? account.roleName : "Account owner"}</p><p className="mt-1 text-[11px] text-slate-400">{isTeamUser ? `${held.size} permissions` : "Full workspace access"}</p></div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-6">{canOpenMembers && <button className={`border-b-2 px-1 pb-3 text-sm font-semibold ${tab === "members" ? "border-emerald-700 text-emerald-800" : "border-transparent text-slate-500"}`} onClick={() => setTab("members")}>Members <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">{users.length}</span></button>}{canOpenRoles && <button className={`border-b-2 px-1 pb-3 text-sm font-semibold ${tab === "roles" ? "border-emerald-700 text-emerald-800" : "border-transparent text-slate-500"}`} onClick={() => setTab("roles")}>Roles & permissions <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">{roles.length}</span></button>}</div><button type="button" title="Refresh team" onClick={() => void loadTeam()} disabled={loading} className="mb-2 rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-50"><LoaderCircle className={loading ? "animate-spin" : ""} size={15}/></button>
      </div>

      {loading ? <div className="flex justify-center py-16 text-sm text-slate-500"><LoaderCircle className="mr-2 animate-spin" size={18}/>Loading team workspace…</div> : tab === "members" ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4"><label className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, mobile or role" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-emerald-600"/></label><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600"><option value="all">All members</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          {filteredUsers.length === 0 ? <div className="py-16 text-center"><Users className="mx-auto mb-3 text-slate-300" size={34}/><p className="font-semibold text-slate-700">No team members found</p><p className="mt-1 text-xs text-slate-400">Add a teammate or adjust your search filters.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Member</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Last sign in</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody>{filteredUsers.map((user) => <tr key={user.accountUserId} className="border-t border-slate-100"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 font-bold text-emerald-800">{user.fullName.slice(0, 1).toUpperCase()}</span><span><b className="block text-slate-800">{user.fullName}</b><small className="text-xs text-slate-400">{user.mobileNumber}</small></span></div></td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{user.roleName}</span></td><td className="px-5 py-4 text-xs text-slate-500">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><i className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-slate-400"}`}/>{user.isActive ? "Active" : "Inactive"}</span></td><td className="px-5 py-4 text-right">{canUpdateUsers && <button type="button" disabled={saving} onClick={() => void toggleMember(user)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${user.isActive ? "text-rose-600 hover:bg-rose-50" : "text-emerald-700 hover:bg-emerald-50"}`}>{user.isActive ? "Deactivate" : "Activate"}</button>}</td></tr>)}</tbody></table></div>}
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">{roles.map((role) => <article key={role.accountRoleId} className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-bold text-slate-900">{role.name}</h2>{role.isSystemRole && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">Default</span>}</div><p className="mt-1 text-xs text-slate-400">{role.userCount} assigned {role.userCount === 1 ? "member" : "members"}</p></div>{canUpdateRoles && !role.isSystemRole && <button type="button" onClick={() => openEditRole(role)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" title="Edit role"><Edit3 size={15}/></button>}</div><div className="mt-4 flex flex-wrap gap-1.5">{role.permissions.slice(0, 8).map((code) => <span key={code} className="rounded-md bg-slate-50 px-2 py-1 text-[10px] text-slate-600">{code}</span>)}{role.permissions.length > 8 && <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">+{role.permissions.length - 8} more</span>}{role.permissions.length === 0 && <span className="text-xs text-slate-400">No permissions assigned</span>}</div></article>)}{roles.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No roles available for your access level.</div>}</section>
      )}

      {memberModal && <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-slate-950/50 p-4"><form onSubmit={saveMember} className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-bold text-slate-900">Add team member</h2><p className="mt-1 text-xs text-slate-500">Create login details and assign a role.</p></div><button type="button" onClick={() => setMemberModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18}/></button></div><div className="mt-5 grid gap-4"><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Full name<input required maxLength={100} value={memberForm.fullName} onChange={(e) => setMemberForm({ ...memberForm, fullName: e.target.value })} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-emerald-600" placeholder="e.g. Priya Sharma"/></label><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Mobile number<input required maxLength={15} value={memberForm.mobileNumber} onChange={(e) => setMemberForm({ ...memberForm, mobileNumber: e.target.value.replace(/\D/g, "") })} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-emerald-600" placeholder="Mobile used to sign in"/></label><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Role<select required value={memberForm.accountRoleId} onChange={(e) => setMemberForm({ ...memberForm, accountRoleId: e.target.value })} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal">{roles.map((role) => <option key={role.accountRoleId} value={role.accountRoleId}>{role.name}</option>)}</select></label><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Initial password<input required minLength={8} maxLength={100} type="password" autoComplete="new-password" value={memberForm.password} onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-emerald-600" placeholder="At least 8 characters"/></label><p className="text-[11px] text-slate-400">Give the member their mobile number and initial password privately. They can sign in using the Team member option.</p></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setMemberModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button disabled={saving} className="rounded-lg bg-[#1D4435] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Adding…" : "Add member"}</button></div></form></div>}

      {roleModal && <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-slate-950/50 p-4"><form onSubmit={saveRole} className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-bold text-slate-900">{editingRole ? `Edit ${editingRole.name}` : "Create a role"}</h2><p className="mt-1 text-xs text-slate-500">Choose permissions for the areas this role should manage.</p></div><button type="button" onClick={() => setRoleModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18}/></button></div><label className="mt-5 grid max-w-md gap-1.5 text-xs font-semibold text-slate-600">Role name<input required maxLength={50} value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-emerald-600" placeholder="e.g. Accountant"/></label><div className="mt-5 grid gap-3 sm:grid-cols-2">{Object.entries(groupedPermissions).map(([module, permissions]) => <section key={module} className="rounded-xl border border-slate-200 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">{module.replaceAll("_", " ")}</h3><button type="button" onClick={() => { const allSelected = permissions.every((item) => roleForm.permissions.includes(item.code)); setRoleForm((current) => ({ ...current, permissions: allSelected ? current.permissions.filter((code) => !permissions.some((item) => item.code === code)) : [...new Set([...current.permissions, ...permissions.map((item) => item.code)])] })); }} className="text-[10px] font-semibold text-emerald-700">Select all</button></div><div className="grid gap-2">{permissions.map((permission) => <label key={permission.code} className="flex cursor-pointer items-start gap-2 rounded-lg p-1.5 hover:bg-slate-50"><input type="checkbox" checked={roleForm.permissions.includes(permission.code)} onChange={() => togglePermission(permission.code)} className="mt-0.5 accent-emerald-700"/><span><b className="block text-[11px] font-semibold text-slate-700">{permission.displayName}</b><small className="block text-[9px] text-slate-400">{permission.code}{permission.description ? ` · ${permission.description}` : ""}</small></span></label>)}</div></section>)}</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setRoleModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button disabled={saving} className="rounded-lg bg-[#1D4435] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : editingRole ? "Save role" : "Create role"}</button></div></form></div>}
    </div>
  );
}
