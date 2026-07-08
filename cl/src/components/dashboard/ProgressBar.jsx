export default function ProgressBar({ tasks }) {

  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const percent   = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="glass-card" style={{ padding: "18px 20px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Daily Progress</h3>
        <span style={{ fontSize: 22, fontWeight: 800, color: "#a78bfa" }}>{percent}%</span>
      </div>

      {/* Main bar */}
      <div style={{
        width: "100%", height: 8, background: "rgba(255,255,255,0.07)",
        borderRadius: 99, overflow: "hidden", marginBottom: 12
      }}>
        <div style={{
          height: "100%",
          width: `${percent}%`,
          background: "linear-gradient(90deg, #7c3aed, #22c55e)",
          borderRadius: 99,
          transition: "width 0.5s ease",
          boxShadow: "0 0 10px rgba(124,58,237,0.4)"
        }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
        <span>{completed} completed</span>
        <span>{total - completed} remaining</span>
      </div>

    </div>
  );
}