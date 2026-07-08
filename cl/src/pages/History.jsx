import { useState } from "react";
import CalendarView from "../components/calendar/CalendarView";

export default function History({ tasks = [] }) {

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filter, setFilter]             = useState("all");

  /* ──────────────────────────────────────────────
     toLocalStr — handles ALL date formats:
     1. "2026-04-05"           → plain string, return as-is
     2. "2026-04-04T18:30:00Z" → ISO string, parse then use LOCAL parts
     3. Date object            → use LOCAL parts directly
     Never use toISOString() — that shifts timezone back to UTC
  ────────────────────────────────────────────── */
  const toLocalStr = (dateVal) => {
    if (!dateVal) return "";

    // Already a plain YYYY-MM-DD string — return directly
    if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      return dateVal;
    }

    // ISO string like "2026-04-04T18:30:00.000Z"
    // new Date() parses it as UTC, then getFullYear/Month/Date
    // reads in LOCAL timezone — correct for India UTC+5:30
    const d  = new Date(dateVal);
    if (isNaN(d.getTime())) return "";

    const y  = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${dy}`;
  };

  /* ── Calendar date → local string ── */
  const calStr = (d) => {
    const y  = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${dy}`;
  };

  const selectedStr = calStr(selectedDate);
  const todayStr    = calStr(new Date());
  const isPast      = selectedStr < todayStr;
  const isFuture    = selectedStr > todayStr;
  const isToday     = selectedStr === todayStr;

  /* ── Now in minutes for today's status ── */
  const now    = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const toMin  = (s) => {
    if (!s) return null;
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  };

  /* ── Get status for each task ── */
  const getStatus = (task) => {
    if (task.completed) return {
      label: "Completed", color: "#4ade80", icon: "✅",
      border: "#22c55e", bg: "rgba(34,197,94,0.06)"
    };

    if (isFuture) return {
      label: "Scheduled", color: "#60a5fa", icon: "📅",
      border: "#3b82f6", bg: "rgba(59,130,246,0.04)"
    };

    if (isPast) return {
      label: "Missed", color: "#f87171", icon: "❌",
      border: "#ef4444", bg: "rgba(239,68,68,0.06)"
    };

    // Today — check actual time
    if (isToday) {
      const startMin = toMin(task.startTime);
      const endMin   = toMin(task.endTime);

      if (startMin !== null && endMin !== null) {
        if (nowMin < startMin) {
          const diff = startMin - nowMin;
          const h = Math.floor(diff / 60), m = diff % 60;
          return {
            label: h > 0 ? `Starts in ${h}h ${m}m` : `Starts in ${m}m`,
            color: "#60a5fa", icon: "⏳",
            border: "#3b82f6", bg: "rgba(59,130,246,0.04)"
          };
        } else if (nowMin < endMin) {
          const rem = endMin - nowMin;
          const h = Math.floor(rem / 60), m = rem % 60;
          return {
            label: h > 0 ? `Running · ${h}h ${m}m left` : `Running · ${m}m left`,
            color: "#4ade80", icon: "▶️",
            border: "#22c55e", bg: "rgba(34,197,94,0.06)"
          };
        } else {
          return {
            label: "Missed", color: "#f87171", icon: "❌",
            border: "#ef4444", bg: "rgba(239,68,68,0.06)"
          };
        }
      }
      return {
        label: "Pending", color: "#f59e0b", icon: "⏰",
        border: "#f59e0b", bg: "rgba(245,158,11,0.04)"
      };
    }

    return { label: "—", color: "#6b7280", icon: "📌", border: "#6b7280", bg: "transparent" };
  };

  /* ── Filter tasks for selected date ── */
  const dayTasks = tasks
    .filter(t => {
      const taskStr = toLocalStr(t.date);
      return taskStr === selectedStr;
    })
    .sort((a, b) => {
      const aMin = toMin(a.startTime) ?? 9999;
      const bMin = toMin(b.startTime) ?? 9999;
      return aMin - bMin;
    });

  const doneCount   = dayTasks.filter(t => t.completed).length;
  const missedCount = dayTasks.filter(t => {
    if (t.completed) return false;
    if (isPast) return true;
    if (isToday) { const e = toMin(t.endTime); return e !== null && nowMin >= e; }
    return false;
  }).length;

  const filtered = filter === "done"
    ? dayTasks.filter(t => t.completed)
    : filter === "missed"
      ? dayTasks.filter(t => {
          if (t.completed) return false;
          if (isPast) return true;
          if (isToday) { const e = toMin(t.endTime); return e !== null && nowMin >= e; }
          return false;
        })
      : dayTasks;

  const priorityColor = {
    purple: "#7c3aed", blue: "#3b82f6",
    orange: "#f97316", red: "#ef4444", gray: "#6b7280"
  };

  return (
    <div style={{ color: "white" }}>

      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>History</h1>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginBottom: 24 }}>
        Browse all your tasks — past, present and future
      </p>

      {/* Calendar */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <CalendarView onDateSelect={setSelectedDate} tasks={tasks} />
      </div>

      {/* Day header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
              {selectedDate.toLocaleDateString("en-GB", {
                weekday: "long", day: "numeric", month: "long", year: "numeric"
              })}
            </h3>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
              background: isToday ? "rgba(34,197,94,0.15)"
                : isFuture ? "rgba(59,130,246,0.15)"
                : "rgba(255,255,255,0.08)",
              border: `1px solid ${isToday ? "rgba(34,197,94,0.3)"
                : isFuture ? "rgba(59,130,246,0.3)"
                : "rgba(255,255,255,0.12)"}`,
              color: isToday ? "#4ade80" : isFuture ? "#60a5fa" : "rgba(255,255,255,0.5)"
            }}>
              {isToday ? "Today" : isFuture ? "Upcoming" : "Past"}
            </span>
          </div>

          {dayTasks.length > 0 && (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
              {dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}
              {!isFuture && ` · ${doneCount} done · ${missedCount} missed`}
            </p>
          )}
        </div>

        {/* Filter tabs */}
        {dayTasks.length > 0 && !isFuture && (
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { key: "all",    label: `All (${dayTasks.length})` },
              { key: "done",   label: `✅ Done (${doneCount})` },
              { key: "missed", label: `❌ Missed (${missedCount})` },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)} style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 12,
                fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                border: filter === key
                  ? "1px solid rgba(124,58,237,0.6)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: filter === key
                  ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                color: filter === key ? "#c4b5fd" : "rgba(255,255,255,0.45)"
              }}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Task list */}
      <div className="glass-card">
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>
              {dayTasks.length === 0 ? "📭" : "🔍"}
            </div>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
              {dayTasks.length === 0
                ? isFuture
                  ? "No tasks scheduled for this day yet"
                  : "No tasks found for this day"
                : `No ${filter} tasks for this day`}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((task, i) => {
              const status = getStatus(task);
              const pColor = priorityColor[task.priority] || "#7c3aed";

              return (
                <div key={task._id || i} style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px", borderRadius: 12,
                  background: status.bg,
                  border: `1px solid ${status.border}33`,
                  borderLeft: `3px solid ${status.border}`,
                  gap: 12
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: status.border + "22", fontSize: 16,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {status.icon}
                  </div>

                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <p style={{
                      fontWeight: 600, fontSize: 14, margin: 0, color: "white",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                    }}>
                      {task.text}
                    </p>
                    {task.startTime && task.endTime && (
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "3px 0 0" }}>
                        🕐 {task.startTime} — {task.endTime}
                      </p>
                    )}
                  </div>

                  <div style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "flex-end", gap: 4, flexShrink: 0
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 8px",
                      borderRadius: 99, background: pColor + "22",
                      border: `1px solid ${pColor}44`, color: pColor
                    }}>
                      {task.priority === "purple" ? "High"
                        : task.priority === "blue" ? "Medium" : "Low"}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: status.color }}>
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}