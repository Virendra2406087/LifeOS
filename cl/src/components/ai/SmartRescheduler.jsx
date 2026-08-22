import { useState } from "react";
import { FaRobot, FaClock } from "react-icons/fa";
import API from "../../app/api";

const toMinutes = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const toTimeString = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

const overlaps = (a, b) => {
  const aStart = toMinutes(a.startTime);
  const aEnd = toMinutes(a.endTime);
  const bStart = toMinutes(b.startTime);
  const bEnd = toMinutes(b.endTime);

  if (aStart === null || aEnd === null || bStart === null || bEnd === null) return false;

  return aStart < bEnd && bStart < aEnd;
};

export default function SmartRescheduler({ tasks = [], setTasks }) {
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);

  const autoReschedule = async () => {
    if (tasks.length === 0 || running) return;

    setRunning(true);
    setMessage("");

    // Only compare tasks on the same date, sorted by start time
    const byDate = {};
    tasks.forEach((t) => {
      if (!byDate[t.date]) byDate[t.date] = [];
      byDate[t.date].push(t);
    });

    const moved = [];
    const updatedTasks = [...tasks];

    for (const date of Object.keys(byDate)) {
      const dayTasks = byDate[date].sort(
        (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)
      );

      for (let i = 1; i < dayTasks.length; i++) {
        const prev = dayTasks[i - 1];
        const curr = dayTasks[i];

        if (overlaps(prev, curr)) {
          const duration = toMinutes(curr.endTime) - toMinutes(curr.startTime);
          const newStart = toMinutes(prev.endTime);
          const newEnd = newStart + duration;

          curr.startTime = toTimeString(newStart);
          curr.endTime = toTimeString(newEnd);

          moved.push(curr);

          // Re-sort remaining tasks for this date since curr's time changed
          dayTasks.splice(i, 1);
          const insertAt = dayTasks.findIndex(
            (t) => toMinutes(t.startTime) > newStart
          );
          dayTasks.splice(insertAt === -1 ? dayTasks.length : insertAt, 0, curr);
          i = 0; // restart scan for this date
        }
      }
    }

    if (moved.length === 0) {
      setMessage("No conflicts found — your schedule is clear.");
      setRunning(false);
      return;
    }

    try {
      await Promise.all(
        moved.map((t) =>
          API.patch(`/tasks/${t._id}`, { startTime: t.startTime, endTime: t.endTime })
        )
      );

      setTasks(updatedTasks);
      setMessage(
        `Rescheduled ${moved.length} conflicting task${moved.length > 1 ? "s" : ""}: ${moved
          .map((t) => `"${t.text}" → ${t.startTime}`)
          .join(", ")}`
      );
    } catch (err) {
      console.error(err.response?.data || err.message);
      setMessage("Detected conflicts, but failed to save the new times. Try again.");
    }

    setRunning(false);
  };

  return (
    <div className="glass-card rescheduler-card">
      <div className="rescheduler-header">
        {/* <FaRobot /> */}
        <span className="lifeos-ai-icon">
      ✨
    </span>
        <h3>AI Smart Rescheduler</h3>
      </div>

      <p>Detect conflicts and automatically move tasks to the nearest available time.</p>

      <button className="reschedule-btn" onClick={autoReschedule} disabled={running}>
        <FaClock />
        {running ? "Checking..." : "Auto Reschedule"}
      </button>

      {message && <div className="reschedule-message">{message}</div>}
    </div>
  );
}