import { useEffect, useState } from "react";
import { Bell, CalendarClock, Send } from "lucide-react";
import { saApi, saError } from "../api";

function localDateTime(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const initialForm = () => ({
  title: "",
  message: "",
  type: "maintenance",
  startsAt: localDateTime(new Date()),
  expiresAt: "",
});

function announcementState(item: any) {
  if (!item.isPublished) return "Withdrawn";
  const now = Date.now();
  if (new Date(item.startsAt).getTime() > now) return "Scheduled";
  if (item.expiresAt && new Date(item.expiresAt).getTime() <= now) return "Expired";
  return "Live";
}

export default function Announcements() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  async function load() {
    const response = await saApi.announcements({ page: 1, pageSize: 100 });
    setItems(response.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load().catch((e) => {
      setError(saError(e));
      setLoading(false);
    });
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setToast("");
    setBusy(true);
    try {
      await saApi.createAnnouncement({
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        startsAt: new Date(form.startsAt).toISOString(),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      });
      setToast("Announcement published. Clients will see it when it starts until they mark it as seen.");
      setForm(initialForm());
      await load();
    } catch (e) {
      setError(saError(e));
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(item: any, isPublished: boolean) {
    const action = isPublished ? "publish" : "withdraw";
    if (!confirm(`Are you sure you want to ${action} this announcement?`)) return;
    setBusy(true);
    setError("");
    setToast("");
    try {
      await saApi.announcementStatus(item.platformAnnouncementId, isPublished);
      setToast(isPublished ? "Announcement published." : "Announcement withdrawn.");
      await load();
    } catch (e) {
      setError(saError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="sa-page-head">
        <div>
          <h1>Client announcements</h1>
          <p>Send platform notices to every RoomEase client account.</p>
        </div>
        <span className="sa-badge"><Bell size={13} style={{ marginRight: 5 }} /> Seen is tracked per client account</span>
      </div>
      {toast && <div className="sa-toast">{toast}</div>}
      {error && <div className="sa-error">{error}</div>}

      <section className="sa-card sa-panel sa-announcement-composer">
        <div className="sa-section-title">
          <span><h3>Compose announcement</h3><span className="sa-panel-sub">Publish now or schedule a notice for later.</span></span>
          <span className="sa-announcement-composer-icon"><Send size={17} /></span>
        </div>
        <form className="sa-announcement-form" onSubmit={submit}>
          <label className="sa-field">Headline
            <input className="sa-input" maxLength={160} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Scheduled maintenance tonight" />
          </label>
          <label className="sa-field">Notice type
            <select className="sa-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="info">General update</option>
              <option value="maintenance">Maintenance</option>
              <option value="warning">Important notice</option>
              <option value="critical">Urgent notice</option>
            </select>
          </label>
          <label className="sa-field sa-announcement-message">Message
            <textarea className="sa-textarea" maxLength={4000} required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="RoomEase will be unavailable for about 5 minutes while we complete scheduled maintenance…" />
            <small>{form.message.length}/4000 · Plain text; line breaks are preserved</small>
          </label>
          <label className="sa-field"><span><CalendarClock size={13} /> Start time (your local time)</span>
            <input className="sa-input" type="datetime-local" required value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          </label>
          <label className="sa-field"><span><CalendarClock size={13} /> Expire at (optional)</span>
            <input className="sa-input" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </label>
          <div className="sa-announcement-form-footer">
            <span>Clients with the app open check for new announcements every 25 seconds. Offline clients see active notices after their next login.</span>
            <button className="sa-primary" disabled={busy}>{busy ? "Publishing…" : "Publish announcement"}</button>
          </div>
        </form>
      </section>

      <section className="sa-card sa-panel sa-announcement-history">
        <div className="sa-section-title"><h3>Announcement history</h3><span className="sa-muted" style={{ fontSize: 11 }}>{items.length} recent notices</span></div>
        {loading ? <div className="sa-loading">Loading announcements…</div> : items.length === 0 ? <div className="sa-empty">No announcements have been published.</div> : <div className="sa-announcement-list">{items.map((item) => {
          const state = announcementState(item);
          return <article className="sa-announcement-item" key={item.platformAnnouncementId}>
            <div className={`sa-announcement-kind ${item.type}`}><Bell size={16} /></div>
            <div className="sa-announcement-copy"><div className="sa-announcement-title-row"><b>{item.title}</b><span className={`sa-badge ${state === "Live" ? "" : state === "Scheduled" ? "warn" : state === "Withdrawn" ? "danger" : ""}`}>{state}</span></div><p>{item.message}</p><small>{item.type} · Starts {new Date(item.startsAt).toLocaleString()}{item.expiresAt ? ` · Expires ${new Date(item.expiresAt).toLocaleString()}` : " · No expiry"}</small></div>
            <div className="sa-announcement-actions">{item.isPublished ? <button className="sa-danger" disabled={busy} onClick={() => setStatus(item, false)}>Withdraw</button> : <button className="sa-secondary" disabled={busy} onClick={() => setStatus(item, true)}>Publish</button>}</div>
          </article>;
        })}</div>}
      </section>
    </>
  );
}
