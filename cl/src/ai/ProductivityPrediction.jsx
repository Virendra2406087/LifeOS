import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { FaChartLine, FaSyncAlt, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { predictProductivity } from "../services/mlService";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // re-predict every 5 min
const CLOCK_TICK_MS = 60 * 1000;           // re-check time-of-day every 1 min

function getFocusWindow(hour) {
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17) return "Evening";
  return "Morning";
}

export default function ProductivityPrediction({ tasks = [] }) {
  const [prediction, setPrediction] = useState({
    score: 0, completed: 0, pending: 0, focus: getFocusWindow(new Date().getHours()), energy: "Medium",
  });
  const [prevScore, setPrevScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refreshTimerRef = useRef(null);
  const clockTimerRef = useRef(null);

  const completed = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);
  const total = tasks.length;
  const pending = total - completed;
  const meetings = useMemo(
    () => tasks.filter((t) => (t.text || "").toLowerCase().includes("meeting")).length,
    [tasks]
  );

  const runPrediction = useCallback(async () => {
    setLoading(true);

    const focus_hours = completed * 0.75;
    const breaks = Math.floor(completed / 3);

    const result = await predictProductivity({
      tasks_completed: completed, tasks_pending: pending, focus_hours, breaks, meetings,
    });

    const score = result.success
      ? Math.round(result.prediction)
      : total === 0 ? 0 : Math.round((completed / total) * 100);

    let energy = "High";
    if (score < 80) energy = "Medium";
    if (score < 40) energy = "Low";

    setPrediction((prev) => {
      setPrevScore(prev.score);
      return {
        score,
        completed,
        pending,
        focus: getFocusWindow(new Date().getHours()),
        energy,
      };
    });
    setUsingFallback(!result.success);
    setLastUpdated(new Date());
    setLoading(false);
  }, [completed, pending, meetings, total]);

  // recompute whenever task counts change
  useEffect(() => {
    runPrediction();
  }, [runPrediction]);

  // auto-refresh loop (picks up drift even if tasks haven't changed)
  useEffect(() => {
    refreshTimerRef.current = setInterval(runPrediction, REFRESH_INTERVAL_MS);
    return () => clearInterval(refreshTimerRef.current);
  }, [runPrediction]);

  // live clock — updates "Best Focus" window as time-of-day crosses a boundary,
  // without needing a full re-prediction
  useEffect(() => {
    clockTimerRef.current = setInterval(() => {
      setPrediction((prev) => {
        const nextFocus = getFocusWindow(new Date().getHours());
        return nextFocus === prev.focus ? prev : { ...prev, focus: nextFocus };
      });
    }, CLOCK_TICK_MS);
    return () => clearInterval(clockTimerRef.current);
  }, []);

  const trend =
    prevScore === null ? null
      : prediction.score > prevScore ? "up"
      : prediction.score < prevScore ? "down"
      : "same";

  return (
    <div className="glass-card productivity-card">
      <div className="prediction-header">
        <FaChartLine />
        <h3>Productivity Prediction</h3>
        <button
          className="prediction-refresh-btn"
          onClick={runPrediction}
          disabled={loading}
          title="Refresh prediction"
        >
          <FaSyncAlt className={loading ? "spin" : ""} />
        </button>
      </div>

      {loading && lastUpdated === null ? (
        <p>Analyzing...</p>
      ) : (
        <>
          <div className="prediction-grid">
            <div className="prediction-box">
              <h2>
                {prediction.score}%
                {trend === "up" && <FaArrowUp className="trend-up" title="Improved" />}
                {trend === "down" && <FaArrowDown className="trend-down" title="Dropped" />}
              </h2>
              <p>Today's Score</p>
            </div>
            <div className="prediction-box"><h2>{prediction.completed}</h2><p>Completed</p></div>
            <div className="prediction-box"><h2>{prediction.pending}</h2><p>Pending</p></div>
            <div className="prediction-box"><h2>{prediction.focus}</h2><p>Best Focus</p></div>
            <div className="prediction-box"><h2>{prediction.energy}</h2><p>Energy</p></div>
          </div>

          <div className="prediction-meta">
            {lastUpdated && (
              <small className="prediction-updated">Updated {lastUpdated.toLocaleTimeString()}</small>
            )}
            {usingFallback && (
              <small className="ml-fallback-note">Offline estimate — ML service unavailable</small>
            )}
          </div>
        </>
      )}
    </div>
  );
}