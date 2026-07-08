import { useState } from "react";
import { FaPlus, FaSearch, FaTrash, FaFile, FaClock, FaCheck, FaCopy, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { trackTask } from "../utils/history";
import TimePicker from "../components/common/TimePicker";

const fmtDate = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const parseYMD = (str) => {
  if (!str) return new Date();
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// ── Reusable calendar picker ──
// If `markedDates` is given, days present in it get a small task-count badge.
// If `restrictToMarked` is true, only marked days are clickable (used for
// "copy from" — you can only pick a day that actually has tasks on it).
function CalendarPicker({ selectedDate, onSelect, markedDates = {}, restrictToMarked = false }) {
  const [viewDate, setViewDate] = useState(() => parseYMD(selectedDate || undefined));

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();

  const now = new Date();
  const todayStr = fmtDate(now.getFullYear(), now.getMonth(), now.getDate());

  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12, padding: "12px 14px"
    }}>
      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, width: 28, height: 28, color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <FaChevronLeft size={11} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{monthLabel}</span>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, width: 28, height: 28, color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <FaChevronRight size={11} />
        </button>
      </div>

      {/* Weekday header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;

          const dateStr    = fmtDate(year, month, d);
          const count      = markedDates[dateStr];
          const hasTasks   = !!count;
          const isSelected = dateStr === selectedDate;
          const isToday    = dateStr === todayStr;
          const disabled   = restrictToMarked && !hasTasks;

          return (
            <button
              type="button"
              key={i}
              disabled={disabled}
              onClick={() => onSelect(dateStr)}
              title={hasTasks ? `${count} task${count > 1 ? "s" : ""}` : undefined}
              style={{
                position: "relative",
                aspectRatio: "1",
                borderRadius: 8,
                border: isSelected
                  ? "1px solid #7c3aed"
                  : isToday
                  ? "1px solid rgba(124,58,237,0.4)"
                  : "1px solid transparent",
                background: isSelected
                  ? "#7c3aed"
                  : hasTasks
                  ? "rgba(124,58,237,0.12)"
                  : "transparent",
                color: disabled
                  ? "rgba(255,255,255,0.15)"
                  : isSelected
                  ? "white"
                  : hasTasks
                  ? "#c4b5fd"
                  : "rgba(255,255,255,0.6)",
                fontSize: 12,
                fontWeight: isSelected || hasTasks ? 700 : 500,
                cursor: disabled ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.12s"
              }}
            >
              {d}
              {hasTasks && !isSelected && (
                <span style={{
                  position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)",
                  width: 4, height: 4, borderRadius: "50%", background: "#a78bfa"
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Tasks({ tasks = [], addTask, toggleTask, deleteTask }) {

  const today = new Date().toISOString().split("T")[0];

  const [search, setSearch]           = useState("");
  const [showForm, setShowForm]       = useState(false);
  const [taskName, setTaskName]       = useState("");
  const [date, setDate]               = useState(today);
  const [startTime, setStartTime]     = useState("");
  const [endTime, setEndTime]         = useState("");
  const [priority, setPriority]       = useState("purple");
  const [loading, setLoading]         = useState(false);

  // ── Copy previous day's schedule ──
  const [showCopyPanel, setShowCopyPanel] = useState(false);
  const [sourceDate, setSourceDate]       = useState("");
  const [targetDate, setTargetDate]       = useState(today);
  const [copying, setCopying]             = useState(false);

  const priorityLabel = { purple: "High", blue: "Medium", gray: "Low" };
  const priorityColor = { purple: "#7c3aed", blue: "#3b82f6", gray: "#6b7280" };

  // How many tasks exist on each date — powers the calendar dots/badges
  const taskCountsByDate = tasks.reduce((acc, t) => {
    if (!t.date) return acc;
    acc[t.date] = (acc[t.date] || 0) + 1;
    return acc;
  }, {});

  const formatDisplayDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
      : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskName || !date || !startTime || !endTime) {
      alert("Please fill all fields");
      return;
    }

    if (startTime >= endTime) {
      alert("End time must be after start time");
      return;
    }

    setLoading(true);

    const taskData = {
      text: taskName,
      date,
      startTime,
      endTime,
      priority,
      completed: false
    };

    try {
      await addTask(taskData);
      trackTask(taskName);

      setShowForm(false);
      setTaskName(""); setDate(today); setStartTime(""); setEndTime(""); setPriority("purple");

    } catch (err) {
      alert(err.response?.data?.error || "Error saving task");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    if (deleteTask) deleteTask(id);
  };

  const handleToggleComplete = (id) => {
    if (toggleTask) toggleTask(id);
  };

  // Recreate every task scheduled on `sourceDate` onto `targetDate`
  const handleCopySchedule = async () => {
    if (!sourceDate || !targetDate) {
      alert("Please choose both a source day and a target date");
      return;
    }

    const tasksToCopy = tasks.filter(t => t.date === sourceDate);
    if (tasksToCopy.length === 0) {
      alert("No tasks found on that date");
      return;
    }

    setCopying(true);
    try {
      for (const t of tasksToCopy) {
        await addTask({
          text: t.text,
          date: targetDate,
          startTime: t.startTime,
          endTime: t.endTime,
          priority: t.priority,
          completed: false
        });
      }
      toast.success(`Copied ${tasksToCopy.length} task${tasksToCopy.length > 1 ? "s" : ""} to ${targetDate}`);
      setShowCopyPanel(false);
      setSourceDate("");
    } catch (err) {
      alert(err.response?.data?.error || "Error copying schedule");
    } finally {
      setCopying(false);
    }
  };

  const filtered = tasks.filter(t =>
    t.text?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="tasks-page">

      {/* Header */}
      <div className="tasks-header">
        <div>
          <h1 className="tasks-title">My Tasks</h1>
          <p className="tasks-count">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="tasks-header-right">
          <div className="tasks-search">
            <FaSearch className="tasks-search-icon" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="tasks-search-input"
            />
          </div>
          <button
            className="tasks-new-btn"
            style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#c4b5fd" }}
            onClick={() => setShowCopyPanel(true)}
            disabled={Object.keys(taskCountsByDate).length === 0}
            title={Object.keys(taskCountsByDate).length === 0 ? "No previous schedules yet" : "Copy a previous day's schedule"}
          >
            <FaCopy /> Copy Previous Schedule
          </button>
          <button className="tasks-new-btn" onClick={() => setShowForm(true)}>
            <FaPlus /> New Task
          </button>
        </div>
      </div>

      {/* Card grid */}
      <div className="tasks-grid">

        {filtered.map((task) => {
          const id      = task._id || task.id;
          const initial = task.text?.[0]?.toUpperCase() || "T";
          const color   = priorityColor[task.priority] || "#7c3aed";

          return (
            <div className="task-card" key={id}>
              <div className="task-card-top" style={{ borderTop: `2px solid ${color}` }}>
                <button
                  className="task-card-checkbox"
                  onClick={() => handleToggleComplete(id)}
                  title={task.completed ? "Mark as incomplete" : "Mark as complete"}
                  style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", marginRight: 10,
                    background: task.completed ? "#10b981" : "rgba(255,255,255,0.06)",
                    border: task.completed ? "none" : "1px solid rgba(255,255,255,0.25)"
                  }}
                >
                  {task.completed && <FaCheck size={11} color="white" />}
                </button>
                <div className="task-card-avatar" style={{ background: color + "33", color }}>
                  {initial}
                </div>
                <div className="task-card-info">
                  <h3 className="task-card-name" style={{
                    textDecoration: task.completed ? "line-through" : "none",
                    opacity: task.completed ? 0.6 : 1
                  }}>
                    {task.text}
                  </h3>
                  <p className="task-card-date">
                    {new Date(task.date || Date.now()).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </p>
                </div>
                <button className="task-card-delete" onClick={() => handleDelete(id)}>
                  <FaTrash />
                </button>
              </div>

              <div className="task-card-progress">
                <span>Progress</span>
                <span>{task.completed ? "100%" : "0%"}</span>
              </div>
              <div className="task-progress-bar">
                <div className="task-progress-fill" style={{
                  width: task.completed ? "100%" : "0%",
                  background: color
                }} />
              </div>

              <div className="task-card-tags">
                <span className="task-tag-pill" style={{
                  color, borderColor: color + "55", background: color + "18"
                }}>
                  {priorityLabel[task.priority] || "High"}
                </span>
                <span className="task-tag-pill">
                  {task.startTime} — {task.endTime}
                </span>
              </div>

              <div className="task-card-actions">
                <button className="task-action-btn task-action-primary">
                  <FaFile /> Details
                </button>
                <button className="task-action-btn">
                  <FaClock /> Time
                </button>
              </div>
            </div>
          );
        })}

        {/* New task card */}
        <div className="task-card task-card-new" onClick={() => setShowForm(true)}>
          <div className="task-new-plus"><FaPlus /></div>
          <p className="task-new-label">New Task</p>
        </div>

      </div>

      {/* Copy Previous Schedule modal */}
      {showCopyPanel && (
        <div className="task-modal-overlay" onClick={() => setShowCopyPanel(false)}>
          <div className="task-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>

            <div className="task-modal-header">
              <h2>Copy Previous Schedule</h2>
              <button className="task-modal-close" onClick={() => setShowCopyPanel(false)}>✕</button>
            </div>

            <div className="task-modal-form">

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Copy tasks from
                  </label>
                  <CalendarPicker
                    selectedDate={sourceDate}
                    onSelect={setSourceDate}
                    markedDates={taskCountsByDate}
                    restrictToMarked
                  />
                  {sourceDate && (
                    <p style={{ fontSize: 12, color: "#a78bfa", margin: "8px 0 0", textAlign: "center" }}>
                      {formatDisplayDate(sourceDate)} · {taskCountsByDate[sourceDate]} task{taskCountsByDate[sourceDate] > 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Apply to date
                  </label>
                  <CalendarPicker
                    selectedDate={targetDate}
                    onSelect={setTargetDate}
                    markedDates={taskCountsByDate}
                  />
                  {targetDate && (
                    <p style={{ fontSize: 12, color: "#a78bfa", margin: "8px 0 0", textAlign: "center" }}>
                      {formatDisplayDate(targetDate)}
                    </p>
                  )}
                </div>

              </div>

              {sourceDate && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "16px 0 0" }}>
                  This will create {taskCountsByDate[sourceDate]} new task
                  {taskCountsByDate[sourceDate] > 1 ? "s" : ""} on {targetDate}, all marked incomplete.
                  Your original tasks on {sourceDate} won't be changed or removed.
                </p>
              )}

              <div className="task-modal-footer">
                <button type="button" className="task-btn-cancel" onClick={() => setShowCopyPanel(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="task-btn-submit"
                  onClick={handleCopySchedule}
                  disabled={copying || !sourceDate}
                >
                  {copying ? "Copying..." : "Apply Schedule"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* New Task modal */}
      {showForm && (
        <div className="task-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="task-modal" onClick={e => e.stopPropagation()}>

            <div className="task-modal-header">
              <h2>Create New Task</h2>
              <button className="task-modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="task-modal-form">

              <div className="task-field">
                <label>Task Name</label>
                <input
                  type="text"
                  value={taskName}
                  onChange={e => setTaskName(e.target.value)}
                  placeholder="Enter task name"
                  required
                />
              </div>

              <div className="task-field">
                <label>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>

              {/* ── iOS-style time pickers ── */}
              <div className="task-field-row">
                <div className="task-field">
                  <TimePicker
                    label="Start Time"
                    value={startTime}
                    onChange={setStartTime}
                  />
                </div>
                <div className="task-field">
                  <TimePicker
                    label="End Time"
                    value={endTime}
                    onChange={setEndTime}
                  />
                </div>
              </div>

              <div className="task-field">
                <label>Priority</label>
                <div className="task-priority-row">
                  {[["purple","High"],["blue","Medium"],["gray","Low"]].map(([val, label]) => (
                    <button
                      type="button"
                      key={val}
                      className="task-priority-btn"
                      style={{
                        borderColor: priority === val ? priorityColor[val] : "transparent",
                        background:  priority === val ? priorityColor[val] + "22" : "rgba(255,255,255,0.04)",
                        color:       priority === val ? priorityColor[val] : "rgba(255,255,255,0.35)"
                      }}
                      onClick={() => setPriority(val)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="task-modal-footer">
                <button type="button" className="task-btn-cancel" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="task-btn-submit" disabled={loading}>
                  {loading ? "Saving..." : "+ Add Task"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}