import { useEffect, useMemo, useState } from "react";
import { FaRobot, FaClock } from "react-icons/fa";
import { predictSchedulerTask } from "../../services/mlService";

const estimateTime = (text = "") => {
  text = text.toLowerCase();
  if (text.includes("meeting")) return 60;
  if (text.includes("study")) return 90;
  if (text.includes("assignment")) return 120;
  if (text.includes("project")) return 180;
  if (text.includes("gym")) return 60;
  if (text.includes("call")) return 20;
  return 45;
};

const priorityScore = (task) => {
  let score = 0;
  if (task.priority === "Critical") score += 100;
  else if (task.priority === "High") score += 80;
  else if (task.priority === "Medium") score += 50;
  else score += 20;

  if (task.deadline) {
    const diff = (new Date(task.deadline) - new Date()) / (1000 * 60 * 60);
    if (diff <= 6) score += 40;
    else if (diff <= 24) score += 20;
  }
  return score;
};

const formatClock = (date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function AIAutoScheduler({ tasks = [] }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  // Stable signature: only changes when task content that actually affects
  // the prediction changes — not on every new array/object reference.
  const tasksSignature = useMemo(
    () =>
      JSON.stringify(
        tasks.map((t) => ({
          text: t.text,
          priority: t.priority,
          deadline: t.deadline,
          duration: t.duration,
        }))
      ),
    [tasks]
  );

  useEffect(() => {
    let cancelled = false;

    async function buildSchedule() {
      setLoading(true);

      if (tasks.length === 0) {
        if (!cancelled) {
          setSchedule([]);
          setLoading(false);
        }
        return;
      }

      const predictions = await Promise.all(
        tasks.map(async (task) => {
          const duration = task.duration ?? estimateTime(task.text);

          const result = await predictSchedulerTask({
            priority: task.priority,
            deadline: task.deadline,
            text: task.text,
            duration,
          });

          if (result.success) {
            return { task, duration, suggestedHour: result.best_hour_24, fromModel: true };
          }

          return { task, duration, suggestedHour: null, fromModel: false };
        })
      );

      if (cancelled) return;

      const anyFellBack = predictions.some((p) => !p.fromModel);
      setUsingFallback(anyFellBack);

      const withHour = predictions
        .filter((p) => p.suggestedHour !== null)
        .sort((a, b) => a.suggestedHour - b.suggestedHour);

      const withoutHour = predictions
        .filter((p) => p.suggestedHour === null)
        .sort((a, b) => priorityScore(b.task) - priorityScore(a.task));

      const ordered = [...withHour, ...withoutHour];

      let cursor = null;

      const laidOut = ordered.map(({ task, duration, suggestedHour, fromModel }) => {
        const now = new Date();
        const anchor = new Date(now);
        anchor.setHours(suggestedHour ?? now.getHours(), 0, 0, 0);

        const start = cursor && cursor > anchor ? new Date(cursor) : anchor;
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + duration);

        cursor = end;

        return {
          ...task,
          duration,
          fromModel,
          start: formatClock(start),
          end: formatClock(end),
        };
      });

      setSchedule(laidOut);
      setLoading(false);
    }

    buildSchedule();
    return () => { cancelled = true; };
    // Depend on the stable signature, NOT the tasks array reference — stops the infinite loop
  }, [tasksSignature]);

  return (
    <div className="glass-card auto-scheduler">
      <div className="scheduler-title">
        {/* <FaRobot /> */}
        <span className="lifeos-ai-icon">
      ✨
    </span>
        <h3>AI Auto Scheduler</h3>
      </div>

      {loading ? (
        <p>Analyzing your tasks...</p>
      ) : schedule.length === 0 ? (
        <p>No tasks available.</p>
      ) : (
        <>
          {usingFallback && (
            <small className="ml-fallback-note">
              Some slots used a fallback estimate — scheduler AI was unavailable for part of this list.
            </small>
          )}
          {schedule.map((task, index) => (
            <div className="schedule-row" key={index}>
              <div>
                <h4>{task.text}</h4>
                <small>
                  <FaClock /> {task.start} - {task.end}
                </small>
              </div>
              <span className="duration-tag">{task.duration} min</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}