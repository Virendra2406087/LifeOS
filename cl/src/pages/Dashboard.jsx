import { useState, useEffect } from "react";
import "./Dashboard.css";
import ReminderAlarm from "../components/ai/ReminderAlarm";
import ScheduleList from "../components/dashboard/ScheduleList";
import AISuggestions from "../components/dashboard/AISuggestions";
import ProgressBar from "../components/dashboard/ProgressBar";
import EnergyCard from "../components/dashboard/EnergyCard";
import StreakCard from "../components/dashboard/StreakCard";
import AddTaskForm from "../components/dashboard/AddTaskForm";
import { useAIPanel } from "../context/AIPanelContext";
import WhatsAppReminder from "../ai/WhatsAppReminder";
import { CalendarDays, Mail, Mic, Timer } from "lucide-react";

export default function Dashboard({
  tasks = [],
  setTasks,
  energyBoost = 0,
}) {
  const { openAIPanel } = useAIPanel();
  const [showAddTask, setShowAddTask] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // AddTaskForm already POSTs the task itself (via app/api.js) and calls
  // this with the server response — we just append it to local state and
  // close the modal. Don't pass App's addTask here, that would double-POST.
  const handleTaskAdded = (newTask) => {
    setTasks((prev) => [...prev, newTask]);
    setShowAddTask(false);
  };

  // Today's date
  const todayStr = new Date().toDateString();

  // Find the next incomplete task for today
  const nextTask = [...tasks]
    .filter(
      (t) =>
        !t.completed &&
        t.date &&
        new Date(t.date).toDateString() === todayStr
    )
    .sort((a, b) => {
      const toMinSort = (time) => {
        if (!time) return 9999;
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
      };
      return toMinSort(a.startTime) - toMinSort(b.startTime);
    })[0];

  const toMin = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
  const nowSec = currentTime.getSeconds();

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
      return { label, color: "#60a5fa" };
    }

    if (nowMin >= startMin && nowMin < endMin) {
      const diffSec = (endMin - nowMin) * 60 - nowSec;
      if (diffSec <= 0) return { label: "Ending now", color: "#f87171" };
      const h = Math.floor(diffSec / 3600);
      const m = Math.floor((diffSec % 3600) / 60);
      const s = diffSec % 60;
      const color = diffSec <= 900 ? "#f59e0b" : "#4ade80";
      const label = h > 0 ? `${h}h ${m}m left`
        : m > 0 ? `${m}m ${String(s).padStart(2,"0")}s left`
        : `${s}s left`;
      return { label, color };
    }

    return { label: "Time's up", color: "#f87171" };
  };

  return (
    <div className="dashboard-page">

      {/* ================= Header ================= */}
      <ReminderAlarm />
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>

          <p className="dashboard-date">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="quick-actions">

        
        <button
          className="ai-sidebar-trigger"
          onClick={() => openAIPanel(null)}
        >
          <span className="lifeos-ai-icon">
      ✨
    </span> 
       LifeOS Features

        </button>
        <button onClick={() => openAIPanel("voice")}>
          <Mic/> Voice AI
        </button>

        <button onClick={() => openAIPanel("copilot")}>
          <span className="lifeos-ai-icon">
      ✨
    </span> 
       LifeOS Copilot
        </button>

        <button onClick={() => openAIPanel("communication")}>
          <Mail/> Gmail
        </button>
        {/* Opens the AI panel that lives inside Sidebar.jsx */}
        
      </div>

      </div>


      {/* ================= Top Cards ================= */}

      <div className="top-cards">

        <EnergyCard tasks={tasks} boost={energyBoost} />

        <StreakCard />

        <div className="stat-card">
  <div className="stat-card-top">
    <span><CalendarDays/> Next Event</span>
  </div>

  {nextTask ? (
    <>
      <h3>{nextTask.text}</h3>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, opacity: 0.6 }}>
          {nextTask.startTime}{nextTask.endTime ? ` → ${nextTask.endTime}` : ""}
        </span>
        {(() => {
          const countdown = getCountdown({ start: nextTask.startTime, end: nextTask.endTime });
          if (!countdown) return null;
          return (
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: countdown.color,
              background: countdown.color + "18",
              border: `1px solid ${countdown.color}44`,
              padding: "2px 9px", borderRadius: 99,
              fontVariantNumeric: "tabular-nums"
            }}>
              <Timer/> {countdown.label}
            </span>
          );
        })()}
      </div>
    </>
  ) : (
    <p>No upcoming task today.</p>
  )}
</div>

      </div>


      {/* ================= Quick Actions ================= */}



      {/* ================= Main Grid ================= */}

      <div className="dashboard-grid">

        <div className="left-column">
          <section className="dashboard-section">
            <h2>Today's Schedule</h2>

            <ScheduleList tasks={tasks} setTasks={setTasks} />

            <WhatsAppReminder />
            <ProgressBar tasks={tasks} />
          </section>
        </div>

        <div className="right-column">
          <AISuggestions tasks={tasks} setTasks={setTasks} />
        </div>

      </div>


      {/* ================= Add Task Modal ================= */}
      {/* AddTaskForm itself has no overlay/close button, so we supply
          the modal chrome here and close it once handleTaskAdded fires. */}
      {showAddTask && (
        <div
          className="add-task-modal-backdrop"
          onClick={() => setShowAddTask(false)}
        >
          <div
            className="add-task-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="add-task-modal-close"
              onClick={() => setShowAddTask(false)}
              aria-label="Close"
            >
              ✕
            </button>

            <AddTaskForm addTask={handleTaskAdded} />
          </div>
        </div>
      )}

    </div>
  );
}