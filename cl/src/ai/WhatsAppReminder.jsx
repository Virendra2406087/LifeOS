import { useEffect, useState } from "react";
import {
  FaWhatsapp,
  FaSpinner,
  FaTrash,
  FaCheckCircle,
  FaExclamationCircle,
  FaClock,
} from "react-icons/fa";
import whatsappService from "../services/whatsappService";
import "./WhatsAppReminder.css";

// How often the live countdown text re-renders. This is display-only —
// nothing here deletes a reminder based on elapsed time. Removal only
// happens when the user clicks "OK" on the ReminderAlarm popup, or hits
// the trash icon below.
const TICK_MS = 1000;

const STATUS_LABEL = {
  pending: "Pending",
  sent: "Sent",
  failed: "Failed",
};

function initialsFor(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default function WhatsAppReminder() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState(null); // { type: 'success'|'error', text }
  const [confirmDelete, setConfirmDelete] = useState(null); // reminder object or null
  const [deletingId, setDeletingId] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadReminders();
  }, []);

  // auto-clear feedback banner after a few seconds
  useEffect(() => {
    if (!actionMsg) return;
    const t = setTimeout(() => setActionMsg(null), 3500);
    return () => clearTimeout(t);
  }, [actionMsg]);

  // Live clock tick — drives the countdown text only.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(t);
  }, []);

  // ReminderAlarm (or anything else) deleted a reminder elsewhere —
  // drop it from this list without a full refetch.
  useEffect(() => {
    const handler = (e) => {
      const id = e.detail?.id;
      if (!id) return;
      setReminders((prev) => prev.filter((r) => r._id !== id));
    };
    window.addEventListener("reminder:removed", handler);
    return () => window.removeEventListener("reminder:removed", handler);
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await whatsappService.getReminders();
      setReminders(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  const requestDelete = (item) => {
    setConfirmDelete(item);
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const confirmDeleteNow = async () => {
    if (!confirmDelete) return;
    const item = confirmDelete;
    try {
      setDeletingId(item._id);
      await whatsappService.deleteReminder(item._id);
      setReminders((prev) => prev.filter((r) => r._id !== item._id));
      window.dispatchEvent(new CustomEvent("reminder:removed", { detail: { id: item._id } }));
      setActionMsg({ type: "success", text: `Deleted reminder for ${item.name}` });
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to delete reminder",
      });
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const formatTime = (time) => {
    const date = new Date(time);
    const isToday = date.toDateString() === new Date().toDateString();
    const label = isToday
      ? "Today"
      : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${label} • ${timeStr}`;
  };

  // Returns a short "time remaining" string, e.g. "2h 15m left", "5m 32s left".
  // Once due, just shows "Due now" — it stays visible until the alarm
  // popup is acknowledged or it's deleted manually.
  const formatCountdown = (time) => {
    const diffMs = new Date(time).getTime() - now;
    if (diffMs <= 0) return "Due now";

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    if (minutes > 0) return `${minutes}m ${seconds}s left`;
    return `${seconds}s left`;
  };

  return (
    <div className="glass-card war-root">
      <div className="war-header">
        <FaWhatsapp className="war-header-icon" />
        <h3>WhatsApp Reminders</h3>
        {!loading && !error && reminders.length > 0 && (
          <span className="war-count">{reminders.length}</span>
        )}
      </div>

      {actionMsg && (
        <div className={`war-toast war-toast-${actionMsg.type}`}>
          {actionMsg.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {loading && (
        <div className="war-loading">
          <FaSpinner className="war-spin" /> Loading reminders...
        </div>
      )}

      {!loading && error && (
        <div className="war-error">
          <FaExclamationCircle />
          <span>{error}</span>
          <button onClick={loadReminders}>Retry</button>
        </div>
      )}

      {!loading && !error && reminders.length === 0 && (
        <div className="war-empty">
          <FaWhatsapp />
          <p>No reminders yet</p>
          <span>Reminders you add will show up here</span>
        </div>
      )}

      {!loading && !error && reminders.length > 0 && (
        <div className="war-list">
          {reminders.map((item) => {
            const status = item.status || "pending";
            return (
              <div className="war-item" key={item._id}>
                <div className="war-avatar" aria-hidden="true">
                  {initialsFor(item.name)}
                </div>

                <div className="war-info">
                  <div className="war-info-top">
                    <h4>{item.name}</h4>
                    <span className={`war-status war-status-${status}`}>
                      <i />
                      {STATUS_LABEL[status] || status}
                    </span>
                  </div>
                  <p className="war-message">{item.message}</p>
                  <div className="war-meta">
                    <span>{formatTime(item.time)}</span>
                    <span className="war-countdown">
                      <FaClock /> {formatCountdown(item.time)}
                    </span>
                  </div>
                </div>

                <button
                  className="war-delete"
                  onClick={() => requestDelete(item)}
                  disabled={deletingId === item._id}
                  title="Delete reminder"
                  aria-label={`Delete reminder for ${item.name}`}
                >
                  {deletingId === item._id ? <FaSpinner className="war-spin" /> : <FaTrash />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="war-modal-overlay" onClick={cancelDelete}>
          <div className="war-modal" onClick={(e) => e.stopPropagation()}>
            <div className="war-modal-icon">
              <FaTrash />
            </div>
            <h4>Delete reminder?</h4>
            <p>
              This will permanently delete the reminder for{" "}
              <strong>{confirmDelete.name}</strong>.
            </p>

            <div className="war-modal-actions">
              <button className="war-modal-cancel" onClick={cancelDelete}>
                Cancel
              </button>
              <button
                className="war-modal-confirm"
                onClick={confirmDeleteNow}
                disabled={deletingId === confirmDelete._id}
              >
                {deletingId === confirmDelete._id ? <FaSpinner className="war-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}