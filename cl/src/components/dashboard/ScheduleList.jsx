import axios from "axios";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

export default function ScheduleList({ tasks = [], setTasks }) {

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState("today");

  // Early-done popup (clicked Done before time ends)
  const [confirmTask, setConfirmTask] = useState(null);

  // Time-complete popup (auto-shown when task time runs out)
  const [expiredTask, setExpiredTask] = useState(null);

  // Reschedule popup (shown when user says "No" to completion)
  const [rescheduleTask, setRescheduleTask] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");

  // Track which task IDs have already triggered the expired popup
  const firedExpiry = useRef(new Set());

  /* ── Clock — ticks every second ── */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ── Check for newly expired tasks every second ── */
  useEffect(() => {
    const nowM = currentTime.getHours() * 60 + currentTime.getMinutes();
    const todayStr = currentTime.toDateString();

    tasks.forEach(task => {
      if (task.completed) return;
      const id = task._id || task.id;
      if (firedExpiry.current.has(id)) return;

      const times = getTimes(task);
      if (!times) return;

      const endMin = toMin(times.end);
      if (endMin === null) return;

      // Check task is today
      const taskDate = task.date ? new Date(task.date).toDateString() : null;
      if (taskDate && taskDate !== todayStr) return;

      // Fire exactly when nowMin crosses endMin
      if (nowM >= endMin) {
        firedExpiry.current.add(id);
        // Only show if no other popup is open
        setExpiredTask(prev => prev ? prev : task);
      }
    });
  }, [currentTime, tasks]);

  /* ── Date helpers ── */
  const today = new Date().toDateString();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toDateString();

  const tomorrowISO = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  /* ── Filter tasks ── */
  const filteredTasks = tasks.filter(task => {
    if (task.completed) return false;
    if (!task.date) return selectedDay === "today";
    const taskDate = new Date(task.date).toDateString();
    if (selectedDay === "today")    return taskDate === today;
    if (selectedDay === "tomorrow") return taskDate === tomorrow;
    return false;
  });

  /* ── Helpers ── */
  const getTimes = (task) => {
    if (task.startTime && task.endTime)
      return { start: task.startTime, end: task.endTime };
    if (task.time && task.time.includes("-")) {
      const parts = task.time.split("-");
      return { start: parts[0].trim(), end: parts[1].trim() };
    }
    return null;
  };

  const toMin = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
  const nowSec = currentTime.getSeconds();

  /* ── Countdown string ── */
  const getCountdown = (times) => {
    const startMin = toMin(times.start);
    const endMin   = toMin(times.end);
    if (startMin === null || endMin === null) return null;

    if (nowMin < startMin) {
      const diffSec = (startMin - nowMin) * 60 - nowSec;
      const h = Math.floor(diffSec / 3600);
      const m = Math.floor((diffSec % 3600) / 60);
      const s = diffSec % 60;
      const label = h > 0 ? `Starts in ${h}h ${m}m`
        : m > 0 ? `Starts in ${m}m ${s}s`
        : `Starts in ${s}s`;
      return { label, color: "#60a5fa", status: "pending" };
    }

    if (nowMin >= startMin && nowMin < endMin) {
      const diffSec = (endMin - nowMin) * 60 - nowSec;
      if (diffSec <= 0) return { label: "Ending now", color: "#f87171", status: "ending" };
      const h = Math.floor(diffSec / 3600);
      const m = Math.floor((diffSec % 3600) / 60);
      const s = diffSec % 60;
      const color = diffSec <= 900 ? "#f59e0b" : "#4ade80";
      const label = h > 0 ? `${h}h ${m}m left`
        : m > 0 ? `${m}m ${String(s).padStart(2,"0")}s left`
        : `${s}s left`;
      return { label, color, status: "running" };
    }

    return { label: "Time's up", color: "#f87171", status: "overdue" };
  };

  /* ── Sort ── */
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aT = getTimes(a); const bT = getTimes(b);
    if (!aT || !bT) return 0;
    return toMin(aT.start) - toMin(bT.start);
  });

  /* ── Complete task ── */
  const handleDoneClick = (task) => {
    const times  = getTimes(task);
    const endMin = times ? toMin(times.end) : null;
    if (endMin !== null && nowMin < endMin) {
      setConfirmTask(task); // early done
      return;
    }
    doComplete(task._id || task.id);
  };

  const doComplete = async (taskId) => {
    setConfirmTask(null);
    setExpiredTask(null);
    setRescheduleTask(null);
    const token = localStorage.getItem("token");
    try {
      const isLocal = !taskId || taskId.toString().length !== 24;
      if (isLocal) {
        setTasks(prev => prev.map(t =>
          (t._id === taskId || t.id === taskId) ? { ...t, completed: true } : t
        ));
      } else {
        await axios.patch(
          `http://localhost:5000/api/tasks/${taskId}`,
          { completed: true },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTasks(prev => prev.map(t =>
          t._id === taskId ? { ...t, completed: true } : t
        ));
      }
      toast.success("Task completed ✅");
    } catch (err) {
      console.error(err);
      toast.error("Error completing task");
    }
  };

  /* ── Reschedule task to a new date ── */
  const doReschedule = async (task, newDate) => {
    if (!newDate) { toast.error("Please pick a date"); return; }
    const token = localStorage.getItem("token");
    const taskId = task._id || task.id;
    const isLocal = !taskId || taskId.toString().length !== 24;

    try {
      if (isLocal) {
        setTasks(prev => prev.map(t =>
          (t._id === taskId || t.id === taskId)
            ? { ...t, date: new Date(newDate).toISOString() }
            : t
        ));
      } else {
        await axios.patch(
          `http://localhost:5000/api/tasks/${taskId}`,
          { date: new Date(newDate).toISOString() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTasks(prev => prev.map(t =>
          t._id === taskId
            ? { ...t, date: new Date(newDate).toISOString() }
            : t
        ));
      }
      setExpiredTask(null);
      setRescheduleTask(null);
      setRescheduleDate("");
      toast.success(`Task rescheduled to ${new Date(newDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} 📅`);
    } catch (err) {
      console.error(err);
      toast.error("Error rescheduling task");
    }
  };

  /* ── Remove task ── */
  const removeTask = async (taskId) => {
    const token = localStorage.getItem("token");
    try {
      const isLocal = !taskId || taskId.toString().length !== 24;
      if (!isLocal) {
        await axios.delete(
          `http://localhost:5000/api/tasks/${taskId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setTasks(prev => prev.filter(t => (t._id || t.id) !== taskId));
      toast.success("Task removed 🗑️");
    } catch (err) {
      console.error(err);
      toast.error("Error removing task");
    }
  };

  /* ── Shared modal style ── */
  const overlay = {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 3000, padding: 20
  };
  const modal = {
    background: "#16161f",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20, padding: "32px 28px",
    maxWidth: 380, width: "100%",
    textAlign: "center", color: "white",
    animation: "fadeIn 0.2s ease"
  };

  /* ── UI ── */
  return (
    <div className="glass-card schedule-container">

      {/* Header */}
      <div className="schedule-header">
        <h3 className="schedule-title">📅 Today's Schedule</h3>
        <div className="schedule-tabs">
          <button className={selectedDay === "today" ? "active-tab" : ""} onClick={() => setSelectedDay("today")}>Today</button>
          <button className={selectedDay === "tomorrow" ? "active-tab" : ""} onClick={() => setSelectedDay("tomorrow")}>Tomorrow</button>
        </div>
      </div>

      {/* Timeline */}
      <div className="timeline">
        {sortedTasks.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, textAlign: "center", padding: "20px 0" }}>
            No tasks scheduled
          </p>
        )}

        {sortedTasks.map((task, index) => {
          const times     = getTimes(task);
          if (!times) return null;
          const id        = task._id || task.id;
          const countdown = getCountdown(times);

          return (
            <div key={id || index} className="timeline-item">
              <div className="timeline-left">
                <span className="time">{times.start}</span>
                <span className={`dot ${countdown?.status === "running" ? "active" : ""}`} />
                {index !== sortedTasks.length - 1 && <span className="line" />}
              </div>

              <div className={`timeline-card ${task.priority || "purple"}`}>
                <div className="card-content" style={{ flex: 1 }}>
                  <div className="task-title">{task.text}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    {times.end && (
                      <span style={{ fontSize: 12, opacity: 0.6 }}>→ {times.end}</span>
                    )}
                    {countdown && (
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: countdown.color,
                        background: countdown.color + "18",
                        border: `1px solid ${countdown.color}44`,
                        padding: "2px 9px", borderRadius: 99,
                        fontVariantNumeric: "tabular-nums"
                      }}>
                        ⏱ {countdown.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="task-actions" style={{ flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  <button className="accept-btn" onClick={() => handleDoneClick(task)}>✓ Done</button>
                  <button className="remove-btn" onClick={() => removeTask(id)}>🗑 Remove</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════
          POPUP 1 — Early done (before time ends)
      ══════════════════════════════════════════ */}
      {confirmTask && (
        <div style={overlay}>
          <div style={modal}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏰</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Time not completed!</h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
              <strong style={{ color: "white" }}>"{confirmTask.text}"</strong>
            </p>
            {(() => {
              const times = getTimes(confirmTask);
              const endMin = times ? toMin(times.end) : null;
              const rem = endMin !== null ? endMin - nowMin : 0;
              return (
                <p style={{ fontSize: 13, color: "#f59e0b", marginBottom: 20, fontWeight: 600 }}>
                  {Math.floor(rem / 60) > 0 ? `${Math.floor(rem/60)}h ${rem%60}m` : `${rem} min`} still remaining
                </p>
              );
            })()}
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
              Mark as done before the scheduled time ends?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmTask(null)} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "transparent", color: "rgba(255,255,255,0.6)",
                fontSize: 14, cursor: "pointer"
              }}>Keep working</button>
              <button onClick={() => doComplete(confirmTask._id || confirmTask.id)} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                border: "none", background: "#7c3aed",
                color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer"
              }}>Mark done anyway</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          POPUP 2 — Time expired: Did you complete it?
      ══════════════════════════════════════════ */}
      {expiredTask && !rescheduleTask && (
        <div style={overlay}>
          <div style={modal}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Time's up!</h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
              Did you complete <strong style={{ color: "white" }}>"{expiredTask.text}"</strong>?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {/* YES */}
              <button
                onClick={() => doComplete(expiredTask._id || expiredTask.id)}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 10,
                  border: "none", background: "#22c55e",
                  color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer"
                }}
              >
                ✅ Yes, done!
              </button>
              {/* NO */}
              <button
                onClick={() => { setRescheduleTask(expiredTask); setExpiredTask(null); }}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 10,
                  border: "none", background: "#ef4444",
                  color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer"
                }}
              >
                ❌ Not yet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          POPUP 3 — Reschedule: next day or pick date
      ══════════════════════════════════════════ */}
      {rescheduleTask && (
        <div style={overlay}>
          <div style={{ ...modal, maxWidth: 420 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Reschedule task</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 24 }}>
              When would you like to reschedule <strong style={{ color: "white" }}>"{rescheduleTask.text}"</strong>?
            </p>

            {/* Quick option — Tomorrow */}
            <button
              onClick={() => doReschedule(rescheduleTask, tomorrowISO)}
              style={{
                width: "100%", padding: "13px",
                borderRadius: 12, border: "1px solid rgba(124,58,237,0.4)",
                background: "rgba(124,58,237,0.15)",
                color: "#c4b5fd", fontSize: 15, fontWeight: 600,
                cursor: "pointer", marginBottom: 12,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}
            >
              📆 Tomorrow — {new Date(tomorrowISO).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
            </button>

            {/* Divider */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 12
            }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>or choose a date</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* Calendar picker */}
            <input
              type="date"
              min={tomorrowISO}
              value={rescheduleDate}
              onChange={e => setRescheduleDate(e.target.value)}
              style={{
                width: "100%", padding: "11px 14px",
                borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "white", fontSize: 14, outline: "none",
                marginBottom: 12, cursor: "pointer"
              }}
            />

            {rescheduleDate && (
              <button
                onClick={() => doReschedule(rescheduleTask, rescheduleDate)}
                style={{
                  width: "100%", padding: "12px",
                  borderRadius: 10, border: "none",
                  background: "#7c3aed", color: "white",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  marginBottom: 10
                }}
              >
                Reschedule to {new Date(rescheduleDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </button>
            )}

            {/* Cancel */}
            <button
              onClick={() => { setRescheduleTask(null); setRescheduleDate(""); }}
              style={{
                width: "100%", padding: "10px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "transparent",
                color: "rgba(255,255,255,0.4)",
                fontSize: 13, cursor: "pointer"
              }}
            >
              Cancel
            </button>

          </div>
        </div>
      )}

    </div>
  );
}