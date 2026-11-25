import { useCallback, useEffect, useState } from "react";
import { Bell, CalendarClock, CircleAlert, Info, ShieldAlert } from "lucide-react";
import { getApiErrorMessage } from "../../api/axios";
import { getUnseenClientAnnouncements, markClientAnnouncementSeen } from "../../api/clientAnnouncements.api";
import "./client-announcements.css";

type ClientAnnouncement = {
  platformAnnouncementId: string;
  title: string;
  message: string;
  type: "info" | "maintenance" | "warning" | "critical";
  startsAt: string;
  expiresAt?: string | null;
};

const icons = {
  info: Info,
  maintenance: CalendarClock,
  warning: CircleAlert,
  critical: ShieldAlert,
};

export default function ClientAnnouncementInbox() {
  const [announcements, setAnnouncements] = useState<ClientAnnouncement[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await getUnseenClientAnnouncements();
      setAnnouncements(Array.isArray(response) ? response : []);
      setError("");
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 25_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function markSeen(announcement: ClientAnnouncement) {
    setBusy(true);
    setError("");
    try {
      await markClientAnnouncementSeen(announcement.platformAnnouncementId);
      setAnnouncements((current) => current.filter(
        (item) => item.platformAnnouncementId !== announcement.platformAnnouncementId,
      ));
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const current = announcements[0];
  if (!current) return null;

  const Icon = icons[current.type] || Bell;
  return (
    <div className="client-announcement-backdrop" role="presentation">
      <section
        className={`client-announcement-dialog ${current.type}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-announcement-title"
        aria-describedby="client-announcement-message"
      >
        <div className="client-announcement-topline">
          <span className="client-announcement-icon"><Icon size={22} /></span>
          <span className={`client-announcement-tag ${current.type}`}>
            {current.type === "info" ? "RoomEase update" : current.type}
          </span>
          <Bell className="client-announcement-bell" size={17} />
        </div>
        <h2 id="client-announcement-title">{current.title}</h2>
        <div id="client-announcement-message" className="client-announcement-message">{current.message}</div>
        {current.type === "maintenance" && current.expiresAt && (
          <div className="client-announcement-time">
            <CalendarClock size={15} /> Expected until {new Date(current.expiresAt).toLocaleString()}
          </div>
        )}
        {error && <div className="client-announcement-error">{error} Please try again.</div>}
        <div className="client-announcement-footer">
          <span>Please acknowledge this notice to continue.</span>
          <button type="button" disabled={busy} onClick={() => void markSeen(current)}>
            {busy ? "Saving…" : "I’ve read this"}
          </button>
        </div>
      </section>
    </div>
  );
}
