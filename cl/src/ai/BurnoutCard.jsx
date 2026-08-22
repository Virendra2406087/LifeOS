import { useEffect, useState } from "react";
import { FaFire } from "react-icons/fa";

export default function BurnoutCard({ tasks = [] }) {

  const [burnout, setBurnout] = useState({
    level: "Low",
    percentage: 20,
    advice: "Keep maintaining your routine."
  });

  useEffect(() => {
    calculateBurnout();
  }, [tasks]);

  function calculateBurnout() {

    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.length - completed;

    let level = "Low";
    let percentage = 20;
    let advice = "Keep maintaining your routine.";

    if (pending >= 3) {
      level = "Medium";
      percentage = 55;
      advice = "Take a short break after completing one task.";
    }

    if (pending >= 6) {
      level = "High";
      percentage = 85;
      advice = "You have many pending tasks. Consider rescheduling.";
    }

    if (pending >= 10) {
      level = "Critical";
      percentage = 100;
      advice = "Burnout risk is very high. Reduce workload immediately.";
    }

    setBurnout({
      level,
      percentage,
      advice
    });
  }

  const color =
    burnout.level === "Low"
      ? "#22c55e"
      : burnout.level === "Medium"
      ? "#f59e0b"
      : burnout.level === "High"
      ? "#ef4444"
      : "#dc2626";

  return (
    <div className="glass-card burnout-card">

      <div className="burnout-header">
        <FaFire />
        <h3>Burnout Prediction</h3>
      </div>

      <h2 style={{ color }}>{burnout.level}</h2>

      <div className="burnout-progress">
        <div
          className="burnout-fill"
          style={{
            width: `${burnout.percentage}%`,
            background: color
          }}
        />
      </div>

      <p>{burnout.percentage}% Risk</p>

      <div className="burnout-advice">
        {burnout.advice}
      </div>

    </div>
  );
}