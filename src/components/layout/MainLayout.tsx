import { useEffect, useState } from "react";

import {
  Building2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileBarChart,
  FileText,
  LayoutDashboard,
  ListTodo,
  Menu,
  ReceiptText,
  Settings,
  SlidersHorizontal,
  UserCog,
  Users,
  Utensils,
  Sparkles,
  ScrollText,
  X,
} from "lucide-react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import OwnerNotificationButton from "../notifications/OwnerNotificationButton";
import ClientAnnouncementInbox from "../announcements/ClientAnnouncementInbox";
import { getAccountAccess } from "../../api/access.api";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  permissions?: string[];
  moduleCode?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "WORKSPACE",
    items: [
      {
        to: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        permissions: ["DASHBOARD.READ"],
      },
      {
        to: "/properties",
        label: "Properties",
        icon: Building2,
        permissions: ["PROPERTIES.READ"],
        moduleCode: "PROPERTIES",
      },
      {
        to: "/tenants",
        label: "Tenants",
        icon: Users,
        permissions: ["TENANTS.READ"],
        moduleCode: "TENANTS",
      },
      {
        to: "/payments",
        label: "Payments",
        icon: CreditCard,
        permissions: ["PAYMENTS.READ"],
        moduleCode: "PAYMENTS",
      },
      {
        to: "/expenses",
        label: "Expenses",
        icon: ReceiptText,
        permissions: ["EXPENSES.READ"],
        moduleCode: "EXPENSES",
      },
      {
        to: "/team",
        label: "Team & Permissions",
        icon: UserCog,
        permissions: ["TEAM.USERS.READ", "TEAM.ROLES.READ"],
      },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      {
        to: "/operations",
        label: "Operations",
        icon: ListTodo,
        permissions: ["TASKS.READ"],
        moduleCode: "TASKS",
      },
      {
        to: "/services",
        label: "Services",
        icon: SlidersHorizontal,
        permissions: ["FNB.READ"],
        moduleCode: "FNB",
      },
      {
        to: "/menu",
        label: "Menu",
        icon: Utensils,
        permissions: ["FNB.READ"],
        moduleCode: "FNB",
      },
      {
        to: "/staff",
        label: "Staff",
        icon: UserCog,
        permissions: ["STAFF.READ"],
        moduleCode: "STAFF",
      },
    ],
  },
  {
    label: "RECORDS",
    items: [
      {
        to: "/onboarding/documents",
        label: "Documents",
        icon: FileText,
        permissions: ["DOCUMENTS.READ"],
      },
      {
        to: "/reports",
        label: "Reports",
        icon: FileBarChart,
        permissions: ["ANALYTICS.READ"],
        moduleCode: "ANALYTICS",
      },
      {
        to: "/audit-logs",
        label: "Audit Logs",
        icon: ScrollText,
        permissions: ["AUDIT_LOGS.READ"],
      },
    ],
  },
];

export default function MainLayout() {
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [ownerName, setOwnerName] = useState("RoomEase Owner");
  const [isTeamUser, setIsTeamUser] = useState(false);
  const [teamRoleName, setTeamRoleName] = useState("");
  const [teamPermissions, setTeamPermissions] = useState<string[]>([]);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [operationsOpen, setOperationsOpen] = useState(true);
  const [recordsOpen, setRecordsOpen] = useState(true);

  useEffect(() => {
    const loadOwnerName = () => {
      try {
        const owner = JSON.parse(
          localStorage.getItem("roomease_owner") || "{}",
        );

        setOwnerName(owner?.fullName || "RoomEase Owner");
        const teamUser = owner?.userType === "TeamUser";
        setIsTeamUser(teamUser);
        setTeamRoleName(owner?.roleName || "");
        setTeamPermissions(Array.isArray(owner?.permissions) ? owner.permissions : []);
      } catch {
        setOwnerName("RoomEase Owner");
        setIsTeamUser(false);
        setTeamRoleName("");
        setTeamPermissions([]);
      }
    };

    loadOwnerName();

    window.addEventListener(
      "roomease-owner-updated",
      loadOwnerName,
    );

    window.addEventListener("storage", loadOwnerName);

    return () => {
      window.removeEventListener(
        "roomease-owner-updated",
        loadOwnerName,
      );
      window.removeEventListener("storage", loadOwnerName);
    };
  }, []);

  useEffect(() => {
    let active = true;
    getAccountAccess()
      .then((access) => {
        if (!active) return;
        const owner = JSON.parse(localStorage.getItem("roomease_owner") || "{}");
        const updatedOwner = {
          ...owner,
          modules: access.modules || [],
          permissions: access.permissions || owner.permissions || [],
          accessLoaded: true,
        };
        localStorage.setItem("roomease_owner", JSON.stringify(updatedOwner));
        setEnabledModules((access.modules || []).map((module) => module.code));
        setTeamPermissions(updatedOwner.permissions);
        window.dispatchEvent(new Event("roomease-owner-updated"));
      })
      .catch(() => {
        if (!active) return;
        const owner = JSON.parse(localStorage.getItem("roomease_owner") || "{}");
        localStorage.setItem("roomease_owner", JSON.stringify({ ...owner, modules: [], accessLoaded: true }));
        setEnabledModules([]);
        window.dispatchEvent(new Event("roomease-owner-updated"));
      });
    return () => { active = false; };
  }, []);

  const ownerInitials =
    ownerName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "RE";
  const canOpenTeam = teamPermissions.some((permission) =>
    ["TEAM.USERS.READ", "TEAM.ROLES.READ"].includes(permission),
  );

  const closeMobile = () => {
    setMobileOpen(false);
  };

  const openSettings = () => {
    closeMobile();
    if (!isTeamUser) navigate("/settings");
    else if (canOpenTeam) navigate("/team");
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={[
        mobile ? "w-full" : "hidden w-[280px] lg:flex",
        "sticky top-0 z-40 h-screen shrink-0",
        "flex-col overflow-hidden",
        "border-r border-[#E3E6DE] bg-gradient-to-b from-white via-white to-[#F7F6F0]",
        "font-sans antialiased shadow-sm",
      ].join(" ")}
    >
      {/* BRAND HEADER */}
      <div className="flex items-center justify-between shrink-0 p-4">
        <button
          type="button"
          onClick={() => {
            closeMobile();
            navigate("/dashboard");
          }}
          className="group relative flex flex-1 items-center gap-3 rounded-xl border border-[#E3E6DE] bg-white p-3 text-left shadow-sm transition-all hover:border-[#C7D3C7] hover:shadow"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1D4435] text-xs font-bold text-white shadow-sm">
            {ownerInitials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-semibold tracking-tight text-[#294436]">
                RoomEase
              </p>
              <Sparkles className="h-3 w-3 text-[#55755A] shrink-0" />
            </div>
            <p className="truncate text-[10px] font-medium text-[#7D887D] uppercase tracking-[0.1em]">
              Property Suite
            </p>
          </div>
        </button>

        {mobile && (
          <button
            type="button"
            onClick={closeMobile}
            className="ml-2 rounded-lg p-2 text-[#7D887D] hover:bg-[#EAF0E8]"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* NAVIGATION ITEMS */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2 [scrollbar-width:thin]">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => {
            const hasRolePermission = !isTeamUser || !item.permissions ||
              item.permissions.some((permission) => teamPermissions.includes(permission));
            const hasModule = !item.moduleCode || enabledModules.includes(item.moduleCode);
            return hasRolePermission && hasModule;
          });
          if (visibleItems.length === 0) return null;
          const isOperations = group.label === "OPERATIONS";
          const isRecords = group.label === "RECORDS";

          const isCollapsed = isOperations
            ? !operationsOpen
            : isRecords
              ? !recordsOpen
              : false;

          return (
            <section
              key={group.label}
              className="mb-5 last:mb-0"
            >
              {group.label === "WORKSPACE" ? (
                <div className="px-3 pb-2 pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7D887D]">
                    WORKSPACE
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (isOperations) {
                      setOperationsOpen((value) => !value);
                    }

                    if (isRecords) {
                      setRecordsOpen((value) => !value);
                    }
                  }}
                  className="mb-1.5 flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-[#7D887D] uppercase transition hover:text-[#294436]"
                >
                  <span>{group.label}</span>

                  {isCollapsed ? (
                    <ChevronDown className="h-3.5 w-3.5 text-[#7D887D]" />
                  ) : (
                    <ChevronUp className="h-3.5 w-3.5 text-[#7D887D]" />
                  )}
                </button>
              )}

              {!isCollapsed && (
                <div className="space-y-1">
                  {visibleItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={closeMobile}
                      className={({ isActive }) =>
                        [
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5",
                          "text-xs font-medium transition-all duration-150",
                          isActive
                            ? "bg-[#E8EFE8] text-[#356248] font-semibold shadow-sm border border-[#D5E2D5]"
                            : "text-[#40543E] hover:bg-[#F2F4EC] hover:text-[#294436]",
                        ].join(" ")
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={[
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all",
                              isActive
                                ? "bg-[#356248] text-white"
                                : "text-[#7D887D] group-hover:text-[#294436] group-hover:bg-white",
                            ].join(" ")}
                          >
                            <Icon strokeWidth={1.5} className="h-4 w-4" />
                          </span>

                          <span className="truncate">
                            {label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* FIXED BOTTOM SECTION */}
      <div className="shrink-0 space-y-2.5 border-t border-[#E3E6DE] bg-[#F7F6F0] p-4">
        {/* NOTIFICATIONS */}
        {!isTeamUser && (
          <div className="overflow-hidden rounded-xl border border-[#E3E6DE] bg-white shadow-sm transition hover:border-[#C7D3C7]">
            <OwnerNotificationButton />
          </div>
        )}

        {/* OWNER PROFILE */}
        <button
          type="button"
          onClick={openSettings}
          className="group flex w-full items-center gap-3 rounded-xl border border-[#E3E6DE] bg-white p-3 text-left shadow-sm transition-all hover:border-[#C7D3C7] hover:shadow"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1D4435] text-xs font-bold text-white shadow-sm">
            {ownerInitials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-[#294436]">
              {ownerName}
            </p>

            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#55755A]" />
              <span className="text-[10px] text-[#7D887D]">
                {isTeamUser ? `Team member · ${teamRoleName || "Member"}` : "Owner account"}
              </span>
            </div>
          </div>

          {(!isTeamUser || canOpenTeam) && (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#F2F4EC] text-[#55755A] transition group-hover:bg-[#E8EFE8]">
              <Settings strokeWidth={1.5} className="h-4 w-4" />
            </div>
          )}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#F7F6F0] font-sans antialiased text-[#2C4136]">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* MOBILE HEADER */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#E3E6DE] bg-white/95 px-4 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-[#55755A] hover:bg-[#E8EFE8]"
              aria-label="Open navigation"
            >
              <Menu strokeWidth={1.8} className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1D4435] text-xs font-bold text-white">
                {ownerInitials}
              </div>

              <span className="text-xs font-semibold tracking-tight text-[#294436]">
                RoomEase
              </span>
            </button>

            {(!isTeamUser || canOpenTeam) && (
              <button
                type="button"
                onClick={openSettings}
                className="rounded-lg p-2 text-[#55755A] hover:bg-[#E8EFE8]"
                aria-label={isTeamUser ? "Open team access" : "Open account settings"}
              >
                <Settings strokeWidth={1.8} className="h-5 w-5" />
              </button>
            )}
          </header>

          <main className="min-w-0 flex-1">
            <ClientAnnouncementInbox />
            {localStorage.getItem("roomease_impersonation_owner_id") && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
                <span>Super Admin ghost login is active for this client account.</span>
                <button
                  type="button"
                  className="rounded-md bg-amber-900 px-3 py-1.5 font-semibold text-white hover:bg-amber-800"
                  onClick={() => {
                    const priorToken = localStorage.getItem("roomease_pre_impersonation_token") || "";
                    const priorOwner = localStorage.getItem("roomease_pre_impersonation_owner") || "";
                    if (priorToken) localStorage.setItem("roomease_token", priorToken);
                    else localStorage.removeItem("roomease_token");
                    if (priorOwner) localStorage.setItem("roomease_owner", priorOwner);
                    else localStorage.removeItem("roomease_owner");
                    const ownerId = localStorage.getItem("roomease_impersonation_owner_id");
                    localStorage.removeItem("roomease_pre_impersonation_token");
                    localStorage.removeItem("roomease_pre_impersonation_owner");
                    localStorage.removeItem("roomease_impersonation_owner_id");
                    navigate(ownerId ? `/super-admin/clients/${ownerId}` : "/super-admin");
                  }}
                >End ghost login</button>
              </div>
            )}
            <Outlet />
          </main>
        </div>

        {/* MOBILE DRAWER */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 bg-[#294436]/40 backdrop-blur-[2px] lg:hidden"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeMobile();
              }
            }}
          >
            <div className="h-full w-[min(20rem,85vw)] bg-white shadow-2xl">
              <Sidebar mobile />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
