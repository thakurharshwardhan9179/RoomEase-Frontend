import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, BedDouble, Building2, Users, UserRound, ShieldCheck } from "lucide-react";
import { saApi, saError } from "../api";

const metrics = [
  ["Total clients", "totalClients", "TotalClients", Users],
  ["Active clients", "activeClients", "ActiveClients", UserRound],
  ["Trial clients", "trialClients", "TrialClients", Activity],
  ["Suspended clients", "suspendedClients", "SuspendedClients", ShieldCheck],
  ["Properties", "totalProperties", "TotalProperties", Building2],
  ["Rooms", "totalRooms", "TotalRooms", BedDouble],
  ["Active tenants", "totalTenants", "TotalTenants", Users],
  ["Staff", "totalStaff", "TotalStaff", UserRound],
] as const;

const getNum = (obj: any, camel: string, pascal: string) =>
  Number(obj?.[camel] ?? obj?.[pascal] ?? 0);

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    saApi
      .dashboard()
      .then((res) => setData(res?.data ?? res))
      .catch((e) => setError(saError(e)));
  }, []);

  if (error) return <div className="sa-error">{error}</div>;
  if (!data) return <div className="sa-loading">Loading platform overview…</div>;

  const totalClients = getNum(data, "totalClients", "TotalClients");
  const total = Math.max(totalClients, 1);

  const statusRows = [
    ["Active", getNum(data, "activeClients", "ActiveClients"), "#356248"],
    ["Trial", getNum(data, "trialClients", "TrialClients"), "#9B712F"],
    ["Suspended", getNum(data, "suspendedClients", "SuspendedClients"), "#A2634B"],
    ["Expired", getNum(data, "expiredClients", "ExpiredClients"), "#7D887D"],
    ["Cancelled", getNum(data, "cancelledClients", "CancelledClients"), "#5C7180"],
  ] as const;

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
        {metrics.map(([label, camelKey, pascalKey, Icon]) => (
          <div className="sa-card sa-stat" key={camelKey}>
            <div className="sa-stat-top">
              {label}
              <span className="sa-stat-icon">
                <Icon size={16} />
              </span>
            </div>
            <strong>{getNum(data, camelKey, pascalKey)}</strong>
            <small>Across RoomEase platform</small>
          </div>
        ))}
      </div>

      <div className="sa-overview-grid">
        <section className="sa-card sa-panel">
          <h3>Subscription health</h3>
          <p className="sa-panel-sub">Accounts by current subscription status</p>
          <div className="sa-status-list">
            {statusRows.map(([label, value, color]) => (
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