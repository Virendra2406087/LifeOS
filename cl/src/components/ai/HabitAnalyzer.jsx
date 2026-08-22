import { useEffect, useState } from "react";
import { FaFire, FaChartLine, FaBrain } from "react-icons/fa";
import { predictHabits } from "../../services/mlService";

export default function HabitAnalyzer({ tasks = [], habitData = {} }) {
  const [bestHabit, setBestHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const completed = tasks.filter((task) => task.completed);
  const fallbackConsistency =
    tasks.length === 0 ? 0 : Math.round((completed.length / tasks.length) * 100);

  const sleep_hours = habitData.sleep_hours ?? 7;
  const exercise_minutes = habitData.exercise_minutes ?? 20;
  const study_hours = habitData.study_hours ?? 2;
  const screen_time = habitData.screen_time ?? 4;
  const water_intake = habitData.water_intake ?? 2;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);

      const result = await predictHabits({
        sleep_hours, exercise_minutes, study_hours, screen_time, water_intake,
      });

      if (cancelled) return;

      if (result.success) {
        setBestHabit(result.prediction);
        setUsingFallback(false);
      } else {
        setBestHabit(null);
        setUsingFallback(true);
      }
      setLoading(false);
    }

    run();
    return () => { cancelled = true; };
    // Depend on primitive values, NOT the habitData object reference — stops the infinite loop
  }, [sleep_hours, exercise_minutes, study_hours, screen_time, water_intake]);

  return (
    <div className="glass-card habit-card">
      <div className="habit-header">
        {/* <FaBrain /> */}
        <span className="lifeos-ai-icon">
      ✨
    </span>
        <h3>AI Habit Analyzer</h3>
        </div>


      {loading ? (
        <p>Analyzing...</p>
      ) : (
        <>
          <div className="habit-box">
            <FaFire className="habit-icon" />
            <div>
              <h2>{bestHabit ?? "—"}</h2>
              <p>Strongest Habit</p>
            </div>
          </div>

          <div className="habit-box">
            <FaChartLine className="habit-icon" />
            <div><h4>{completed.length}</h4><p>Completed Tasks</p></div>
          </div>

          <div className="habit-message">
            {usingFallback
              ? `Habit AI unavailable — based on tasks, you're at ${fallbackConsistency}% consistency.`
              : `Based on your recent sleep, exercise, study, screen time, and water intake, ${bestHabit} is your strongest habit right now.`}
          </div>
        </>
      )}
    </div>
  );
}