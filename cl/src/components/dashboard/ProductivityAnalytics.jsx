import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function ProductivityAnalytics({ tasks }) {

  const completed      = tasks.filter(t => t.completed).length;
  const pending        = tasks.length - completed;
  const completionRate = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

  const data   = [
    { name: "Completed", value: completed || 0.001 },
    { name: "Pending",   value: pending   || 0.001 }
  ];
  const COLORS = ["#22c55e", "#f97316"];

  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-card-label">Productivity</span>
        <span className="stat-card-value-sm" style={{ color: "#a78bfa" }}>{completionRate}%</span>
      </div>

      <ResponsiveContainer width="100%" height={100}>
        <PieChart>
          <Pie
            data={data}
            innerRadius={30}
            outerRadius={46}
            dataKey="value"
            paddingAngle={3}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#1a1a28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white" }}
            itemStyle={{ color: "rgba(255,255,255,0.7)" }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="stat-card-sub">{completed}/{tasks.length} tasks done</div>
    </div>
  );
}