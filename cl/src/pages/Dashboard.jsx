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
    <div className="dashboard-page">

      {/* ── Page title ── */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-date">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── Stat cards row ── */}
      <div className="top-cards">

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
              <div className="stat-card-value next-event-text">
                {nextTask.text}
              </div>
              <div className="next-event-pill">
                🕐 {nextTask.startTime} — {nextTask.endTime}
              </div>
            </>
          ) : (
            <>
              <div className="stat-card-value stat-card-empty">
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
        <div className="dashboard-col">
          <ScheduleList tasks={tasks} setTasks={setTasks} />
          <ProgressBar  tasks={tasks} />
        </div>

        {/* Right column */}
        <div className="dashboard-col">
          <AISuggestions tasks={tasks} setTasks={setTasks} />
          <Suggestion    tasks={tasks} />
        </div>

      </div>

    </div>
  );
}