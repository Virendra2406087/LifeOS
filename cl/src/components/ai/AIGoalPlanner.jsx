import { useState } from "react";
import { FaSpinner, FaCheckCircle, FaRegCircle } from "react-icons/fa";
import { generateGoalPlan } from "../../services/goalPlannerService";

const FALLBACK_PLAN = [
  { period: "Week 1", tasks: ["Research the goal", "Create roadmap", "Collect resources"] },
  { period: "Week 2", tasks: ["Practice fundamentals", "Complete mini project"] },
  { period: "Week 3", tasks: ["Build portfolio", "Review progress"] },
  { period: "Week 4", tasks: ["Final project", "Interview preparation", "Publish work"] },
];

// ── Defensive normalizer ──
// Gemini's JSON output can drift: {period,tasks}, {week,items}, {title,steps},
// or occasionally a plain string. This guarantees a consistent shape downstream
// so the UI never silently renders blank or throws.
function normalizePlan(raw) {
  if (!Array.isArray(raw)) return null;

  const normalized = raw
    .map((item, i) => {
      if (!item || typeof item !== "object") return null;

      const period =
        item.period || item.week || item.title || item.phase || `Phase ${i + 1}`;

      let tasks = item.tasks || item.items || item.steps || item.actions || [];
      if (typeof tasks === "string") tasks = [tasks];
      if (!Array.isArray(tasks)) return null;

      tasks = tasks.filter((t) => typeof t === "string" && t.trim().length > 0);
      if (tasks.length === 0) return null;

      return { period: String(period), tasks };
    })
    .filter(Boolean);

  return normalized.length > 0 ? normalized : null;
}

export default function AIGoalPlanner() {
  const [goal, setGoal] = useState("");
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState({}); // { "0-1": true }

  const generatePlan = async () => {
    if (!goal.trim() || loading) return;

    setLoading(true);
    setError("");
    setPlan([]);
    setDone({});

    try {
      const result = await generateGoalPlan(goal.trim());
      const normalized = result?.success ? normalizePlan(result.plan) : null;

      if (normalized) {
        setPlan(normalized);
      } else {
        setError("AI planner unavailable — showing a general template instead.");
        setPlan(FALLBACK_PLAN);
      }
    } catch {
      setError("AI planner unavailable — showing a general template instead.");
      setPlan(FALLBACK_PLAN);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") generatePlan();
  };

  const toggleTask = (wi, ti) => {
    const key = `${wi}-${ti}`;
    setDone((p) => ({ ...p, [key]: !p[key] }));
  };

  const totalTasks = plan.reduce((sum, p) => sum + p.tasks.length, 0);
  const doneCount = Object.values(done).filter(Boolean).length;
  const progress = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  return (
    <div style={S.container}>
      <div style={S.header}>
        <span className="lifeos-ai-icon">
      ✨
    </span>
        <h3 style={S.title}>AI Goal Planner</h3>
      </div>

      <div style={S.inputRow}>
        <input
          style={S.input}
          placeholder="Example: Become MERN Developer"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button style={{ ...S.btn, opacity: loading || !goal.trim() ? 0.5 : 1 }} onClick={generatePlan} disabled={loading || !goal.trim()}>
          {loading ? <FaSpinner style={S.spin} /> : <span className="lifeos-ai-icon">
      ✨
    </span>}
          {loading ? "Generating…" : "Generate"}
        </button>
      </div>

      {error && <p style={S.error}>{error}</p>}

      {plan.length > 0 && (
        <>
          <div style={S.progressWrap}>
            <div style={S.progressBarBg}>
              <div style={{ ...S.progressBarFill, width: `${progress}%` }} />
            </div>
            <span style={S.progressLabel}>
              {doneCount}/{totalTasks} done · {progress}%
            </span>
          </div>

          <div style={S.weekGrid}>
            {plan.map((item, wi) => {
              const weekDone = item.tasks.filter((_, ti) => done[`${wi}-${ti}`]).length;
              return (
                <div style={S.weekCard} key={wi}>
                  <div style={S.weekHeader}>
                    <h4 style={S.weekTitle}>{item.period}</h4>
                    <span style={S.weekCount}>
                      {weekDone}/{item.tasks.length}
                    </span>
                  </div>
                  <ul style={S.taskList}>
                    {item.tasks.map((task, ti) => {
                      const key = `${wi}-${ti}`;
                      const isDone = !!done[key];
                      return (
                        <li
                          key={ti}
                          style={{ ...S.taskItem, ...(isDone ? S.taskItemDone : {}) }}
                          onClick={() => toggleTask(wi, ti)}
                        >
                          {isDone ? <FaCheckCircle style={S.checkOn} /> : <FaRegCircle style={S.checkOff} />}
                          <span style={{ ...S.taskText, ...(isDone ? S.taskTextDone : {}) }}>{task}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

const S = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: 20,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    backdropFilter: "blur(20px)",
  },
  header: { display: "flex", alignItems: "center", gap: 8 },
  logo: { fontSize: 18 },
  title: {
    fontFamily: "'Syne',sans-serif",
    fontSize: 16,
    fontWeight: 800,
    background: "linear-gradient(135deg,#a855f7,#3b82f6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    margin: 0,
  },
  inputRow: { display: "flex", gap: 8 },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#f1f5f9",
    fontSize: 13.5,
    outline: "none",
  },
  btn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg,#7c3aed,#a855f7)",
    color: "white",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 15px rgba(124,58,237,0.4)",
  },
  spin: { animation: "spin 0.8s linear infinite" },
  error: {
    fontSize: 12.5,
    color: "#fca5a5",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: 8,
    padding: "8px 12px",
    margin: 0,
  },
  progressWrap: { display: "flex", flexDirection: "column", gap: 6 },
  progressBarBg: { height: 8, borderRadius: 6, background: "rgba(255,255,255,0.06)", overflow: "hidden" },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
    background: "linear-gradient(90deg,#7c3aed,#a855f7)",
    transition: "width 0.4s ease",
  },
  progressLabel: { fontSize: 11.5, color: "#94a3b8", fontWeight: 600 },
  weekGrid: { display: "flex", flexDirection: "column", gap: 12 },
  weekCard: {
    padding: 14,
    borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    animation: "fadeIn 0.3s ease",
  },
  weekHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  weekTitle: { fontSize: 13.5, fontWeight: 700, color: "#c4b5fd", margin: 0 },
  weekCount: {
    fontSize: 11,
    fontWeight: 700,
    color: "#a855f7",
    background: "rgba(124,58,237,0.15)",
    padding: "2px 8px",
    borderRadius: 8,
  },
  taskList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 },
  taskItem: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "7px 10px",
    borderRadius: 8,
    cursor: "pointer",
    transition: "background 0.15s",
  },
  taskItemDone: { background: "rgba(124,58,237,0.08)" },
  taskText: { fontSize: 13, color: "#cbd5e1", lineHeight: 1.4 },
  taskTextDone: { color: "#64748b", textDecoration: "line-through" },
  checkOn: { color: "#a855f7", fontSize: 15, flexShrink: 0 },
  checkOff: { color: "#475569", fontSize: 15, flexShrink: 0 },
};