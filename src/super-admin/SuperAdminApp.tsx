import { useEffect, useState } from "react";
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Activity, Bell, LayoutDashboard, LogOut, ShieldCheck, Users } from "lucide-react";
import { saApi, saError } from "./api";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import AuditLogs from "./pages/AuditLogs";
import Permissions from "./pages/Permissions";
import Announcements from "./pages/Announcements";
import "./super-admin.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await saApi.login(email, password);
      localStorage.setItem("roomease_super_admin_token", r.token);
      navigate("/super-admin", { replace: true });
    } catch (x) {
      setError(saError(x));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="sa-login">
      <div className="sa-login-card">
        <div className="sa-brand-mark">
          <ShieldCheck size={23} />
        </div>
        <span className="sa-eyebrow">PLATFORM CONTROL</span>
        <h1>Super Admin</h1>
        <p>Sign in to manage the RoomEase platform.</p>
        <form onSubmit={submit}>
          <label>
            Email address
            <input
              autoComplete="username"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@roomease.com"
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <div className="sa-error">{error}</div>}
          <button className="sa-primary sa-wide" disabled={busy}>
            {busy ? "Signing in…" : "Sign in securely"}
          </button>
        </form>
        <Link to="/login" className="sa-back-link">
          ← Return to RoomEase
        </Link>
      </div>
    </main>
  );
}

function Shell() {
  const [admin, setAdmin] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    saApi.me().then(setAdmin).catch(() => {});
  }, []);

  const title = location.pathname.includes("clients/")
    ? "Client overview"
    : location.pathname.includes("clients")
    ? "Clients"
    : location.pathname.includes("audit")
    ? "Audit log"
    : location.pathname.includes("permissions")
    ? "Permission catalog"
    : location.pathname.includes("announcements")
    ? "Announcements"
    : "Dashboard";

  return (
    <div className="sa-shell">
      <aside className="sa-sidebar">
        <div className="sa-logo">
          <span className="sa-brand-mark">
            <ShieldCheck size={20} />
          </span>
          <span>
            <b>RoomEase</b>
            <small>PLATFORM ADMIN</small>
          </span>
        </div>
        <div className="sa-nav-label">WORKSPACE</div>
        <nav>
          <NavLink end to="/super-admin">
            <LayoutDashboard />
            Dashboard
          </NavLink>
          <NavLink to="/super-admin/clients">
            <Users />
            Clients
          </NavLink>
          <NavLink to="/super-admin/announcements">
            <Bell />
            Announcements
          </NavLink>
          <NavLink to="/super-admin/permissions">
            <ShieldCheck />
            Permissions
          </NavLink>
          <NavLink to="/super-admin/audit-logs">
            <Activity />
            Audit log
          </NavLink>
        </nav>
        <div className="sa-sidebar-bottom">
          <div className="sa-admin-avatar">
            {(admin?.fullName || "SA").slice(0, 1).toUpperCase()}
          </div>
          <div className="sa-admin-meta">
            <b>{admin?.fullName || "Super Admin"}</b>
            <small>{admin?.email || "Platform access"}</small>
          </div>
          <button
            title="Sign out"
            className="sa-icon-button"
            onClick={() => {
              localStorage.removeItem("roomease_super_admin_token");
              navigate("/super-admin/login");
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <main className="sa-main">
        <header className="sa-topbar">
          <div>
            <div className="sa-breadcrumb">
              RoomEase <span>/</span> Platform
            </div>
            <h2>{title}</h2>
          </div>
          <div className="sa-top-right">
            <span className="sa-live">
              <i /> All systems
            </span>
            <span className="sa-top-avatar">
              {(admin?.fullName || "S").slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>
        <div className="sa-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function SuperAdminApp() {
  const location = useLocation();
  const token = localStorage.getItem("roomease_super_admin_token");

  if (location.pathname.endsWith("/login")) {
    return token ? <Navigate to="/super-admin" replace /> : <Login />;
  }
  if (!token) {
    return <Navigate to="/super-admin/login" replace />;
  }

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:ownerId" element={<ClientDetails />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="permissions" element={<Permissions />} />
        <Route path="*" element={<Navigate to="/super-admin" replace />} />
      </Route>
    </Routes>
  );
}
