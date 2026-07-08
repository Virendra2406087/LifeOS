export default function UrgencyCard({ tasks }) {

  const total       = tasks?.length || 0;
  const highPriority = tasks?.filter(t => t.priority === "purple")?.length || 0;
  const percent     = total === 0 ? 0 : Math.round((highPriority / total) * 100);

  let label = "Low";
  let color = "#22c55e";
  let emoji = "🟢";

  if (percent >= 60) {
    label = "High";   color = "#ef4444"; emoji = "🚨";
  } else if (percent >= 30) {
    label = "Medium"; color = "#f59e0b"; emoji = "⚡";
  }

  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-card-label">Urgency</span>
        <span className="stat-card-emoji">{emoji}</span>
      </div>

      <div className="stat-card-value" style={{ color }}>{label} Priority</div>

      {/* Thin progress bar */}
      <div className="urgency-track">
        <div
          className="urgency-fill-bar"
          style={{ width: `${percent}%`, background: color, boxShadow: `0 0 8px ${color}80` }}
        />
      </div>

      <div className="stat-card-sub">{highPriority} urgent task{highPriority !== 1 ? "s" : ""}</div>
    </div>
  );
}