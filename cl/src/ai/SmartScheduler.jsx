import { useEffect, useState } from "react";
import { FaRobot } from "react-icons/fa";
import { predictSchedulerTask } from "../services/mlService";

export default function SmartScheduler({ tasks = [] }) {
  const [suggestion, setSuggestion] = useState({
    time: "—",
    message: "Analyzing...",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);

      if (tasks.length === 0) {
        if (!cancelled) {
          setSuggestion({ time: "9:00 AM", message: "Your day is free. Best time to start working." });
          setLoading(false);
        }
        return;
      }

      const nextTask = tasks.find((t) => !t.completed) ?? tasks[tasks.length - 1];

      const result = await predictSchedulerTask({
        priority: nextTask.priority,
        deadline: nextTask.deadline,
        text: nextTask.text,
        duration: nextTask.duration,
      });

      if (cancelled) return;

      if (result.success) {
        setSuggestion({
          time: result.best_hour_display,
          message: `AI recommends starting "${nextTask.text}" around this time.`,
        });
      } else {
        setSuggestion({ time: "9:00 AM", message: "Scheduler AI unavailable — showing default slot." });
      }
      setLoading(false);
    }

    run();
    return () => { cancelled = true; };
  }, [tasks]);

  return (
    <div className="glass-card smart-scheduler">
      <div className="scheduler-header">
        {/* <FaRobot /> */}
        <span className="lifeos-ai-icon">
      ✨
    </span>
        <h3>Smart Scheduler</h3>
      </div>

      {loading ? (
        <p>Analyzing...</p>
      ) : (
        <>
          <div className="scheduler-slot">
            <h2>{suggestion.time}</h2>
          </div>
          <p>{suggestion.message}</p>
        </>
      )}
    </div>
  );
}