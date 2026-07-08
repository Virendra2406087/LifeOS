import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function CalendarView({ onDateSelect, tasks = [] }) {

  const [date, setDate] = useState(new Date());

  /* ── Local date string — NO toISOString() to avoid UTC shift ── */
  const toLocalStr = (dateVal) => {
    if (!dateVal) return "";

    // Already a plain YYYY-MM-DD string (new tasks stored as string)
    if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      return dateVal;
    }

    // Date object or ISO string — read local parts
    const d  = new Date(dateVal);
    const y  = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${dy}`;
  };

  /* ── Calendar date → local string (from tile date prop) ── */
  const calStr = (d) => {
    const y  = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${dy}`;
  };

  const handleDateChange = (selectedDate) => {
    setDate(selectedDate);
    if (onDateSelect) onDateSelect(selectedDate);
  };

  /* ── Count tasks per day for dot intensity ── */
  const tileContent = ({ date: tileDate }) => {
    const tileStr = calStr(tileDate);

    const dayTasks = tasks.filter(t => toLocalStr(t.date) === tileStr);

    if (dayTasks.length === 0) return null;

    const completed = dayTasks.filter(t => t.completed).length;
    const total     = dayTasks.length;
    const allDone   = completed === total;
    const noneDone  = completed === 0;

    // Color: green if all done, red if none done, amber if partial
    const dotColor = allDone ? "#22c55e" : noneDone ? "#a78bfa" : "#f59e0b";

    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        marginTop: 2
      }}>
        {/* Show up to 3 dots based on task count */}
        {Array.from({ length: Math.min(total, 3) }).map((_, i) => (
          <div
            key={i}
            style={{
              width:        i === 0 ? 6 : 4,
              height:       i === 0 ? 6 : 4,
              borderRadius: "50%",
              background:   dotColor,
              boxShadow:    i === 0 ? `0 0 4px ${dotColor}` : "none"
            }}
          />
        ))}
      </div>
    );
  };

  /* ── Tile class for styling ── */
  const tileClassName = ({ date: tileDate }) => {
    const tileStr  = calStr(tileDate);
    const hasTask  = tasks.some(t => toLocalStr(t.date) === tileStr);
    return hasTask ? "has-task-tile" : null;
  };

  return (
    <div className="calendar-wrapper">
      <Calendar
        onChange={handleDateChange}
        value={date}
        tileContent={tileContent}
        tileClassName={tileClassName}
      />

      {/* Legend */}
      <div style={{
        display: "flex", gap: 16, justifyContent: "center",
        marginTop: 12, flexWrap: "wrap"
      }}>
        {[
          { color: "#a78bfa", label: "Scheduled" },
          { color: "#f59e0b", label: "In progress" },
          { color: "#22c55e", label: "All done" },
        ].map(({ color, label }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center",
            gap: 6, fontSize: 11,
            color: "rgba(255,255,255,0.45)"
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: color, boxShadow: `0 0 4px ${color}`
            }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}