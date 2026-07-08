// % of energy spent per completed task. Tune this if tasks should feel
// more/less tiring — creating tasks never touches energy, only completing them does.
const ENERGY_COST_PER_TASK = 15;

export default function EnergyCard({ tasks, boost = 0 }) {

  const todayStr  = new Date().toDateString();
  const todaysTasks = tasks?.filter(t => t.date && new Date(t.date).toDateString() === todayStr) || [];

  const total     = todaysTasks.length;
  const completed = todaysTasks.filter(t => t.completed).length;

  // Energy starts full and drains as tasks are completed (effort spent),
  // independent of how many tasks exist or get created.
  const taskPercent = Math.max(0, 100 - completed * ENERGY_COST_PER_TASK);

  // Combine remaining task-energy with boosts earned from Low Energy Mode tips
  const percent = Math.min(100, taskPercent + boost);

  let color = "#22c55e";
  let label = "High";
  let emoji = "🚀";
  let glow  = "rgba(34,197,94,0.35)";

  if (percent < 40) {
    color = "#ef4444"; label = "Low";    emoji = "😴"; glow = "rgba(239,68,68,0.35)";
  } else if (percent < 70) {
    color = "#f59e0b"; label = "Medium"; emoji = "⚡"; glow = "rgba(245,158,11,0.35)";
  }

  const radius = 30;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div
      className="stat-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      {/* Circular progress ring */}
      <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
        <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="36" cy="36" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
          />
          <circle
            cx="36" cy="36" r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.5s ease",
              filter: `drop-shadow(0 0 6px ${glow})`,
            }}
          />
        </svg>

        <div
          style={{
            position: "absolute",
            top: 0, left: 0, width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}
        >
          {emoji}
        </div>
      </div>

      {/* Text content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="stat-card-label" style={{ marginBottom: 4 }}>
          Energy Level
        </div>

        <div
          className="stat-card-value"
          style={{ color, fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}
        >
          {label}
        </div>

        <div className="stat-card-sub" style={{ marginTop: 4 }}>
          {total === 0
            ? (boost > 0 ? `+${boost}% from Low Energy tips` : "No tasks yet — full energy!")
            : `${completed} / ${total} tasks done${boost > 0 ? ` · +${boost}% boost` : ""}`}
        </div>
      </div>
    </div>
  );
}