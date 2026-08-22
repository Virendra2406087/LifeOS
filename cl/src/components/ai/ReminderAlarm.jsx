import { useEffect, useRef, useState } from "react";
import { FaBell, FaClock } from "react-icons/fa";
import { fetchReminders, updateReminderTime, deleteReminder } from "../../services/reminderService";

// Check every 15s — frequent enough that a reminder set for e.g. 5:00 PM
// pops up within 15 seconds of that time, without hammering the API.
const CHECK_INTERVAL_MS = 15 * 1000;

const ACK_STORAGE_KEY = "lifeos_acknowledged_reminders";

function loadAcknowledged() {
  try {
    const raw = localStorage.getItem(ACK_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveAcknowledged(set) {
  try {
    localStorage.setItem(ACK_STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

export default function ReminderAlarm() {
  const [reminders, setReminders] = useState([]);
  const [activeReminder, setActiveReminder] = useState(null);
  const [showExtend, setShowExtend] = useState(false);
  const [clearing, setClearing] = useState(false);
  const ackRef = useRef(loadAcknowledged());

  const load = async () => {
    const result = await fetchReminders();
    if (result.success) setReminders(result.data);
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("reminder:added", handler);
    return () => window.removeEventListener("reminder:added", handler);
  }, []);

  // If some other part of the app removed a reminder (or this component
  // just deleted one itself), drop it from local state without a refetch.
  useEffect(() => {
    const handler = (e) => {
      const id = e.detail?.id;
      if (!id) return;
      setReminders((prev) => prev.filter((r) => r._id !== id));
    };
    window.addEventListener("reminder:removed", handler);
    return () => window.removeEventListener("reminder:removed", handler);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();

      // Find the earliest due, not-yet-acknowledged, not-already-sent
      // reminder. Only one popup shows at a time — if several are due,
      // the next appears once the current one is dismissed/extended.
      const due = reminders
        .filter((r) => {
          if (ackRef.current.has(r._id)) return false;
          if (r.status === "sent") return false;
          return new Date(r.time) <= now;
        })
        .sort((a, b) => new Date(a.time) - new Date(b.time))[0];

      if (due && (!activeReminder || activeReminder._id !== due._id)) {
        setActiveReminder(due);
        setShowExtend(false);
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders, activeReminder]);

  // Clicking OK deletes the reminder for good — this is the *only* place
  // a reminder gets removed once its time has passed. Nothing else in the
  // app auto-deletes based on elapsed time.
  const handleOk = async () => {
    if (!activeReminder || clearing) return;
    const id = activeReminder._id;

    setClearing(true);
    const result = await deleteReminder(id);
    setClearing(false);

    if (result.success) {
      setReminders((prev) => prev.filter((r) => r._id !== id));
      window.dispatchEvent(new CustomEvent("reminder:removed", { detail: { id } }));
    } else {
      // If the delete failed server-side, fall back to just acknowledging
      // so the popup doesn't reappear immediately, but the item stays
      // visible in the list so it isn't silently lost.
      ackRef.current.add(id);
      saveAcknowledged(ackRef.current);
    }

    setActiveReminder(null);
    setShowExtend(false);
  };

  const handleExtend = async (minutes) => {
    if (!activeReminder) return;
    const newTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    const result = await updateReminderTime(activeReminder._id, newTime);
    if (result.success) {
      setReminders((prev) =>
        prev.map((r) => (r._id === activeReminder._id ? { ...r, time: newTime } : r))
      );
    }
    setActiveReminder(null);
    setShowExtend(false);
  };

  if (!activeReminder) return null;

  return (
    <div className="reminder-alarm-overlay">
      <div className="reminder-alarm-modal glass-card">
        <div className="reminder-alarm-icon"><FaBell /></div>
        <h3>Reminder</h3>
        <p className="reminder-alarm-name">{activeReminder.name}</p>
        <p className="reminder-alarm-message">{activeReminder.message}</p>
        <p className="reminder-alarm-time">
          <FaClock />{" "}
          {new Date(activeReminder.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>

        {!showExtend ? (
          <div className="reminder-alarm-actions">
            <button className="reminder-alarm-extend" onClick={() => setShowExtend(true)} disabled={clearing}>
              Extend Time
            </button>
            <button className="reminder-alarm-ok" onClick={handleOk} disabled={clearing}>
              {clearing ? "Clearing..." : "OK"}
            </button>
          </div>
        ) : (
          <div className="reminder-alarm-extend-options">
            <p>Remind me again in:</p>
            <div className="reminder-alarm-extend-buttons">
              <button onClick={() => handleExtend(5)}>5 min</button>
              <button onClick={() => handleExtend(10)}>10 min</button>
              <button onClick={() => handleExtend(15)}>15 min</button>
              <button onClick={() => handleExtend(30)}>30 min</button>
            </div>
            <button className="reminder-alarm-cancel-extend" onClick={() => setShowExtend(false)}>
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}