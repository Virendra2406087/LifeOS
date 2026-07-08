import ScheduleList        from "../components/dashboard/ScheduleList";
import AISuggestions       from "../components/dashboard/AISuggestions";
import ProductivityAnalytics from "../components/dashboard/ProductivityAnalytics";
import ProgressBar         from "../components/dashboard/ProgressBar";
import Suggestion          from "../components/dashboard/Suggestion";
import EnergyCard          from "../components/dashboard/EnergyCard";
import StreakCard          from "../components/dashboard/StreakCard";

export default function Dashboard({ tasks, setTasks, energyBoost = 0 }) {

  /* Next upcoming task (soonest start time today) */
  const todayStr = new Date().toDateString();

  const nextTask = [...(tasks || [])]
    .filter(t => !t.completed && t.date && new Date(t.date).toDateString() === todayStr)
    .sort((a, b) => {
      const toMin = s => { if (!s) return 9999; const [h, m] = s.split(":").map(Number); return h * 60 + m; };
      return toMin(a.startTime) - toMin(b.startTime);
    })[0];

  return (
    <div>

      {/* ── Page title ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Dashboard</h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginTop: 4 }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── Stat cards row ── */}
      <div className="top-cards" style={{ marginBottom: 20 }}>

        <EnergyCard tasks={tasks} boost={energyBoost} />
        <StreakCard />

        {/* Next Event */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Next Event</span>
            <span className="stat-card-emoji">📅</span>
          </div>
          {nextTask ? (
            <>
              <div className="stat-card-value" style={{ fontSize: 15, color: "white", marginBottom: 6 }}>
                {nextTask.text}
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)",
                padding: "4px 10px", borderRadius: 8, fontSize: 12, color: "#c4b5fd"
              }}>
                🕐 {nextTask.startTime} — {nextTask.endTime}
              </div>
            </>
          ) : (
            <>
              <div className="stat-card-value" style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>
                No upcoming events
              </div>
              <div className="stat-card-sub">Schedule a task for today</div>
            </>
          )}
        </div>

        <ProductivityAnalytics tasks={tasks} />

      </div>

      {/* ── Main grid ── */}
      <div className="main-grid">

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ScheduleList tasks={tasks} setTasks={setTasks} />
          <ProgressBar  tasks={tasks} />
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <AISuggestions tasks={tasks} setTasks={setTasks} />
          <Suggestion    tasks={tasks} />
        </div>

      </div>

    </div>
  );
}