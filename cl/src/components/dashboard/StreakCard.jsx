import { useState, useEffect } from "react";
import { calculateStreak } from "../../utils/calculateStreak";

export default function StreakCard() {
  const [streak, setStreak] = useState({ current: 0, longest: 0, activeToday: false });

  useEffect(() => {
    const update = () => setStreak(calculateStreak());
    update();

    window.addEventListener("historyUpdated", update);
    return () => window.removeEventListener("historyUpdated", update);
  }, []);

  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-card-label">Daily Streak</span>
        <span className="stat-card-emoji">🔥</span>
      </div>

      <div className="stat-card-value" style={{ fontSize: 22, color: "white" }}>
        {streak.current} {streak.current === 1 ? "day" : "days"}
      </div>

      <div className="stat-card-sub">
        {streak.activeToday
          ? `Longest streak: ${streak.longest} days`
          : "Do something today to keep it going!"}
      </div>
    </div>
  );
}