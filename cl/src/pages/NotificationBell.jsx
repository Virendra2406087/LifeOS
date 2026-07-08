import { useState, useRef, useEffect, useCallback } from "react";
import { FaBell, FaCheck, FaTrash, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";

export default function NotificationBell({ tasks = [] }) {

  const [open, setOpen]           = useState(false);
  const [dismissed, setDismissed] = useState([]);
  const [readIds, setReadIds]     = useState([]);
  const [now, setNow]             = useState(new Date());
  const firedAlerts               = useRef(new Set());
  const ref                       = useRef();

  /* ── Clock tick every 30s ── */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  /* ── Close on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Request browser notification permission once ── */
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  /* ── Helper: "HH:MM" → minutes since midnight ── */
  const toMin = (t) => {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  /* ── Local date string using local timezone (fixes UTC shift bug) ── */
  const toLocalDateStr = (dateVal) => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    // Use local year/month/day — NOT toISOString() which is UTC
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${day}`;
  };

  const nowMin   = now.getHours() * 60 + now.getMinutes();
  const todayStr = toLocalDateStr(now); // local today string

  /* ── Fire browser notification + toast for tasks ending ≤15 min ── */
  useEffect(() => {
    tasks.forEach(task => {
      if (task.completed || !task.endTime || !task.date) return;

      const taskDate = toLocalDateStr(task.date);
      if (taskDate !== todayStr) return;

      const endMin = toMin(task.endTime);
      if (endMin === null) return;

      const diff = endMin - nowMin;
      const id   = task._id || task.id;
      const key  = `${id}-15alert`;

      // Fire once when between 1-15 min remaining
      if (diff > 0 && diff <= 15 && !firedAlerts.current.has(key)) {
        firedAlerts.current.add(key);

        // Toast popup
        toast.warning(`⏰ "${task.text}" ends in ${diff} min!`, {
          autoClose: 8000,
          position: "top-right"
        });

        // Browser notification
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("⏰ Task ending soon!", {
            body: `"${task.text}" ends in ${diff} minutes`,
            icon: "/LifeOS_logo.jpeg"
          });
        }
      }
    });
  }, [nowMin, tasks, todayStr]);

  /* ── Build notification items ── */
  const notifications = tasks
    .filter(t => !t.completed && !dismissed.includes(t._id || t.id))
    .map(task => {
      const id       = task._id || task.id;
      const taskDate = toLocalDateStr(task.date);
      const isToday  = taskDate === todayStr;
      const isPast   = taskDate && taskDate < todayStr;
      const startMin = toMin(task.startTime);
      const endMin   = toMin(task.endTime);

      let timeLabel = "New task";
      let color     = "#a78bfa";
      let emoji     = "📋";

      if (isToday && startMin !== null && endMin !== null) {
        if (nowMin < startMin) {
          const diff = startMin - nowMin;
          if (diff <= 60) {
            timeLabel = `Starts in ${diff} min`;
            color = "#60a5fa"; emoji = "⏳";
          } else {
            const h = Math.floor(diff / 60), m = diff % 60;
            timeLabel = `Starts in ${h}h${m > 0 ? ` ${m}m` : ""}`;
            color = "#a78bfa"; emoji = "📋";
          }
        } else if (nowMin >= startMin && nowMin < endMin) {
          const remaining = endMin - nowMin;
          if (remaining <= 15) {
            timeLabel = `Ends in ${remaining} min`;
            color = "#f59e0b"; emoji = "⏰";
          } else {
            timeLabel = `Running · ${remaining} min left`;
            color = "#4ade80"; emoji = "▶️";
          }
        } else {
          timeLabel = "Overdue"; color = "#f87171"; emoji = "⚠️";
        }
      } else if (isPast) {
        timeLabel = "Overdue"; color = "#f87171"; emoji = "⚠️";
      }

      return { id, title: task.text, timeLabel, color, emoji };
    });

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  const markRead    = (id) => setReadIds(prev => [...prev, id]);
  const deleteNotif = (id) => setDismissed(prev => [...prev, id]);
  const markAllRead = () => setReadIds(notifications.map(n => n.id));
  const clearAll    = () => setDismissed(prev => [
    ...prev, ...notifications.map(n => n.id)
  ]);

  return (
    <div className="notification-container" ref={ref} style={{ position: "relative" }}>

      {/* Bell */}
      <div
        className="nav-icon-btn"
        onClick={() => setOpen(p => !p)}
        style={{ cursor: "pointer" }}
      >
        <FaBell size={15} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {/* Panel */}
      {open && (
        <div className="notif-panel">

          <div className="notif-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="notif-title">Notifications</span>
              {unreadCount > 0 && (
                <span className="notif-new-badge">{unreadCount} new</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {unreadCount > 0 && (
                <button className="notif-action-btn" onClick={markAllRead}>
                  <FaCheck size={9} /> Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button className="notif-action-btn notif-action-clear" onClick={clearAll}>
                  <FaTrash size={9} /> Clear
                </button>
              )}
            </div>
          </div>

          <div className="notif-list">

            {notifications.length === 0 && (
              <div className="notif-empty">
                <FaBell size={22} style={{ opacity: 0.2, marginBottom: 8 }} />
                <p>All caught up!</p>
              </div>
            )}

            {notifications.map(n => {
              const isRead = readIds.includes(n.id);
              return (
                <div
                  key={n.id}
                  className={`notif-item ${isRead ? "notif-item-read" : ""}`}
                >
                  <div
                    className="notif-icon-box"
                    style={{ background: n.color + "22", border: `1px solid ${n.color}44` }}
                  >
                    <span style={{ fontSize: 14 }}>{n.emoji}</span>
                  </div>

                  <div className="notif-content">
                    <p className="notif-item-title">{n.title}</p>
                    <span className="notif-item-time" style={{ color: n.color }}>
                      {n.timeLabel}
                    </span>
                  </div>

                  {!isRead && (
                    <div className="notif-unread-dot" style={{ background: n.color }} />
                  )}

                  <div className="notif-item-actions">
                    {!isRead && (
                      <button
                        className="notif-btn notif-btn-check"
                        onClick={() => markRead(n.id)}
                        title="Mark as read"
                      >
                        <FaCheck size={10} />
                      </button>
                    )}
                    <button
                      className="notif-btn notif-btn-delete"
                      onClick={() => deleteNotif(n.id)}
                      title="Delete"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                </div>
              );
            })}

          </div>

        </div>
      )}

    </div>
  );
}