import { useEffect, useState, useCallback, useRef } from "react";
import { FaBrain, FaBatteryHalf, FaSyncAlt, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { predictBurnout } from "../../services/mlService";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // auto-refresh every 5 min

export default function BurnoutPredictor({
  tasks = [],
  sleepHours = 7,      // now a real prop, not hardcoded forever
  breakHoursOverride,  // optional manual override
}) {
  const [burnout, setBurnout] = useState(0);
  const [prevBurnout, setPrevBurnout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const intervalRef = useRef(null);

  // derive a stable "signature" so we only recompute when task counts actually change
  const completed = tasks.filter((t) => t.completed).length;
  const pending = tasks.filter((t) => !t.completed).length;
  const taskSignature = `${completed}-${pending}`;

  const runPrediction = useCallback(async () => {
    setLoading(true);

    const breakHours =
      breakHoursOverride ?? Math.min(2, completed * 0.15);

    const result = await predictBurnout({
      tasks_completed: completed,
      tasks_pending: pending,
      focus_hours: completed * 0.75,
      break_hours: breakHours,
      sleep_hours: sleepHours,
      stress_level: Math.min(10, pending),
    });

    setBurnout((prev) => {
      setPrevBurnout(prev);
      return result.success
        ? result.prediction
        : Math.min(100, pending * 15 + Math.max(0, 50 - completed * 5));
    });
    setUsingFallback(!result.success);
    setLastUpdated(new Date());
    setLoading(false);
  }, [completed, pending, sleepHours, breakHoursOverride]);

  // run on mount + whenever task counts actually change
  useEffect(() => {
    runPrediction();
  }, [taskSignature, runPrediction]);

  // live auto-refresh loop
  useEffect(() => {
    intervalRef.current = setInterval(runPrediction, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [runPrediction]);

  let level = "Low", color = "#22c55e", tip = "You're maintaining a healthy workload.";
  if (burnout > 40) { level = "Medium"; color = "#f59e0b"; tip = "Take short breaks every 90 minutes."; }
  if (burnout > 70) { level = "High"; color = "#ef4444"; tip = "Reduce workload and prioritize rest today."; }

  const trend =
    prevBurnout === null ? null : burnout > prevBurnout ? "up" : burnout < prevBurnout ? "down" : "same";

  return (
    <div className="glass-card burnout-card">
      <div className="burnout-header">
        {/* <FaBrain /> */}
        <span className="lifeos-ai-icon">
      ✨
    </span>
        <h3>AI Burnout Predictor</h3>
        <button
          className="burnout-refresh-btn"
          onClick={runPrediction}
          disabled={loading}
          title="Refresh prediction"
        >
          <FaSyncAlt className={loading ? "spin" : ""} />
        </button>
      </div>

      {loading && burnout === 0 ? (
        <p>Analyzing...</p>
      ) : (
        <>
          <div className="burnout-score">
            <FaBatteryHalf size={32} color={color} />
            <div>
              <h2>
                {burnout}%
                {trend === "up" && <FaArrowUp className="trend-up" title="Increased" />}
                {trend === "down" && <FaArrowDown className="trend-down" title="Decreased" />}
              </h2>
              <p>{level} Risk</p>
            </div>
          </div>

          <div className="burnout-bar">
            <div
              className="burnout-fill"
              style={{
                width: `${burnout}%`,
                background: color,
                transition: "width 0.6s ease, background 0.6s ease",
              }}
            />
          </div>

          <div className="burnout-tip">{tip}</div>

          <div className="burnout-meta">
            {lastUpdated && (
              <small className="burnout-updated">
                Updated {lastUpdated.toLocaleTimeString()}
              </small>
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