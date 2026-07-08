import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function Analytics({ tasks = [] }) {

  /* ── Helpers ── */
  const getDuration = (start, end) => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return (eh * 60 + em - (sh * 60 + sm)) / 60;
  };

  /* ── Metrics ── */
  const completedTasks  = tasks.filter(t => t.completed).length;
  const pendingTasks    = tasks.length - completedTasks;
  const completionRate  = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

  /* ── Weekly focus ── */
  const weeklyFocus = [0, 0, 0, 0, 0, 0, 0];
  tasks.forEach(task => {
    if (!task.date) return;
    const day = new Date(task.date).getDay();
    weeklyFocus[day] += getDuration(task.startTime, task.endTime);
  });

  /* ── Priority ── */
  const priorityCount = { high: 0, medium: 0, low: 0 };
  tasks.forEach(task => {
    if (task.priority === "red")       priorityCount.high++;
    else if (task.priority === "blue") priorityCount.medium++;
    else                               priorityCount.low++;
  });

  /* ── Chart defaults ── */
  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "rgba(255,255,255,0.6)", font: { size: 12 } }
      },
      tooltip: {
        backgroundColor: "#1a1a28",
        titleColor: "white",
        bodyColor: "rgba(255,255,255,0.7)",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: "rgba(255,255,255,0.5)" },
        grid:  { color: "rgba(255,255,255,0.05)" }
      },
      y: {
        ticks: { color: "rgba(255,255,255,0.5)" },
        grid:  { color: "rgba(255,255,255,0.05)" }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "rgba(255,255,255,0.6)", font: { size: 12 }, padding: 16 }
      },
      tooltip: {
        backgroundColor: "#1a1a28",
        titleColor: "white",
        bodyColor: "rgba(255,255,255,0.7)",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1
      }
    }
  };

  /* ── Chart data ── */
  const lineData = {
    labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [{
      label: "Focus Hours",
      data: weeklyFocus,
      borderColor: "#7c3aed",
      backgroundColor: "rgba(124,58,237,0.15)",
      tension: 0.4,
      fill: true,
      pointBackgroundColor: "#7c3aed",
      pointRadius: 4
    }]
  };

  const barData = {
    labels: ["Completed", "Pending"],
    datasets: [{
      label: "Tasks",
      data: [completedTasks, pendingTasks],
      backgroundColor: ["rgba(34,197,94,0.7)", "rgba(249,115,22,0.7)"],
      borderColor:     ["#22c55e", "#f97316"],
      borderWidth: 1,
      borderRadius: 6
    }]
  };

  const priorityData = {
    labels: ["High", "Medium", "Low"],
    datasets: [{
      data: [priorityCount.high, priorityCount.medium, priorityCount.low],
      backgroundColor: [
        "rgba(239,68,68,0.8)",
        "rgba(250,204,21,0.8)",
        "rgba(34,197,94,0.8)"
      ],
      borderColor: ["#ef4444", "#facc15", "#22c55e"],
      borderWidth: 1
    }]
  };

  /* ── Stat cards ── */
  const stats = [
    { label: "Total Tasks",      value: tasks.length,     color: "#7c3aed" },
    { label: "Completed",        value: completedTasks,   color: "#22c55e" },
    { label: "Pending",          value: pendingTasks,     color: "#f97316" },
    { label: "Completion Rate",  value: completionRate + "%", color: "#3b82f6" },
  ];

  /* ── UI ── */
  return (
    <div style={{ color: "white" }}>

      {/* Page title */}
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Analytics</h1>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginBottom: 28 }}>
        Track your productivity and task performance
      </p>

      {/* Stat summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {stats.map(({ label, value, color }) => (
          <div key={label} className="glass-card" style={{ padding: "18px 20px", borderLeft: `3px solid ${color}` }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
              {label}
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="analytics-grid">

        <div className="glass-card chart-card">
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Weekly Focus Hours</h3>
          <div className="chart">
            <Line data={lineData} options={chartDefaults} />
          </div>
        </div>

        <div className="glass-card chart-card">
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Task Completion</h3>
          <div className="chart">
            <Bar data={barData} options={chartDefaults} />
          </div>
        </div>

        <div className="glass-card chart-card">
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Priority Distribution</h3>
          <div className="chart">
            <Doughnut data={priorityData} options={doughnutOptions} />
          </div>
        </div>

      </div>

    </div>
  );
}