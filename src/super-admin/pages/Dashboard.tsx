import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, BedDouble, Building2, Users, UserRound, ShieldCheck } from "lucide-react";
import { saApi, saError } from "../api";

const metrics = [
  ["Total clients", "TotalClients", Users], 
  ["Active clients", "ActiveClients", UserRound],
  ["Trial clients", "TrialClients", Activity], 
  ["Suspended clients", "SuspendedClients", ShieldCheck],
  ["Properties", "TotalProperties", Building2], 
  ["Rooms", "TotalRooms", BedDouble],
  ["Active tenants", "TotalTenants", Users], 
  ["Staff", "TotalStaff", UserRound],
] as const;

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    saApi.dashboard().then(setData).catch(e => setError(saError(e)));
  }, []);

  if (error) return <div className="sa-error">{error}</div>;
  if (!data) return <div className="sa-loading">Loading platform overview…</div>;

  const total = Math.max(data.TotalClients || 0, 1);

  return (
    <>
      <div className="sa-page-head">
        <div>
          <h1>Platform overview</h1>
          <p>Monitor client accounts and RoomEase usage at a glance.</p>
        </div>
        <Link className="sa-primary" to="/super-admin/clients">Browse clients</Link>
      </div>

      <div className="sa-stats">
        {metrics.map(([label, key, Icon]) => (
          <div className="sa-card sa-stat" key={key}>
            <div className="sa-stat-top">
              {label}
              <span className="sa-stat-icon">
                <Icon size={16} />
              </span>
            </div>
            <strong>{data[key] ?? 0}</strong>
            <small>Across RoomEase platform</small>
          </div>
        ))}
      </div>

      <div className="sa-overview-grid">
        <section className="sa-card sa-panel">
          <h3>Subscription health</h3>
          <p className="sa-panel-sub">Accounts by current subscription status</p>
          <div className="sa-status-list">
            {[
              ["Active", data.ActiveClients, "#356248"],
              ["Trial", data.TrialClients, "#9B712F"],
              ["Suspended", data.SuspendedClients, "#A2634B"],
              ["Expired", data.ExpiredClients, "#7D887D"],
              ["Cancelled", data.CancelledClients, "#5C7180"]
            ].map(([label, value, color]: any) => (
              <div className="sa-status-line" key={label}>
                <span>{label}</span>
                <span className="sa-track">
                  <i style={{ width: `${Math.min((value / total) * 100, 100)}%`, background: color }} />
                </span>
                <b>{value}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="sa-card sa-panel">
          <h3>Quick actions</h3>
          <p className="sa-panel-sub">Common platform administration tasks</p>
          <div className="sa-shortcuts">
            <Link className="sa-shortcut" to="/super-admin/clients">
              <Users size={17} />Search and manage client accounts
            </Link>
            <Link className="sa-shortcut" to="/super-admin/audit-logs">
              <Activity size={17} />Review administrator activity
            </Link>
            <Link className="sa-shortcut" to="/super-admin/permissions">
              <ShieldCheck size={17} />Maintain permission catalog
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}