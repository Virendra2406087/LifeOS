import { useEffect, useState } from "react";
import { FaClock, FaBrain } from "react-icons/fa";
import { predictDurationTask } from "../../services/mlService";

const fallbackEstimate = (task) => {
  const text = (task.text || "").toLowerCase();

  if (text.includes("meeting")) return 60;
  if (text.includes("study")) return 90;
  if (text.includes("assignment")) return 120;
  if (text.includes("project")) return 180;
  if (text.includes("gym")) return 60;
  if (text.includes("call")) return 20;
  if (text.includes("email")) return 15;

  return 45;
};

const PRIORITY_MAP = { Critical: 4, High: 3, Medium: 2, Low: 1 };

export default function AITimeEstimator({ tasks = [] }) {
  const [estimates, setEstimates] = useState({});
  const [loading, setLoading] = useState(true);

  const tasksSignature = JSON.stringify(
    tasks.map((t) => ({ text: t.text, priority: t.priority, deadline: t.deadline, category: t.category }))
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);

      const results = await Promise.all(
        tasks.map(async (task) => {
          const result = await predictDurationTask({
            importance: PRIORITY_MAP[task.priority] ?? 2,
            category: task.category ?? 1, // placeholder until real category data is wired in
            text: task.text,
            deadline: task.deadline,
          });

          return {
            key: task._id ?? task.text,
            minutes: result.success ? Math.round(result.prediction) : fallbackEstimate(task),
            fromModel: result.success,
          };
        })
      );

      if (cancelled) return;

      const map = {};
      results.forEach((r) => { map[r.key] = r; });
      setEstimates(map);
      setLoading(false);
    }

    if (tasks.length > 0) {
      run();
    } else {
      setEstimates({});
      setLoading(false);
    }

    return () => { cancelled = true; };
  }, [tasksSignature]);

  return (
    <div className="glass-card ai-time-card">
      <div className="time-header">
        {/* <FaBrain className="time-icon" /> */}
        <span className="lifeos-ai-icon">
      ✨
    </span>
        <h3>AI Time Estimator</h3>

      </div>

      {tasks.length === 0 ? (
        <p>No tasks available.</p>
      ) : loading ? (
        <p>Estimating...</p>
      ) : (
        tasks.map((task, index) => {
          const est = estimates[task._id ?? task.text];

          return (
            <div key={index} className="time-item">
              <div>
                <h4>{task.text}</h4>
                <small>{est?.fromModel ? "AI Estimated Duration" : "Estimated Duration (offline)"}</small>
              </div>

              <div className="time-badge">
                <FaClock />
                {est?.minutes ?? fallbackEstimate(task)} min
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}