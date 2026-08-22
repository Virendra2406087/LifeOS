import { useEffect, useState } from "react";
import { FaLightbulb, FaCheck, FaTimes } from "react-icons/fa";

export default function AISuggestions({ tasks = [] }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    generateSuggestions();
  }, [tasks]);

  const generateSuggestions = () => {
    const data = [];

    const pending = tasks.filter(
      (task) => !task.completed && !task.done
    );

    const completed = tasks.filter(
      (task) => task.completed || task.done
    );

    if (pending.length >= 5) {
      data.push({
        id: 1,
        text: "You have many pending tasks. Finish the highest priority task first.",
      });
    }

    if (completed.length >= 5) {
      data.push({
        id: 2,
        text: "Great job! You're highly productive today.",
      });
    }

    const overdue = pending.filter((task) => task.status === "Overdue");

    if (overdue.length > 0) {
      data.push({
        id: 3,
        text: `${overdue.length} overdue task(s). Consider rescheduling them.`,
      });
    }

    if (pending.length === 0 && completed.length > 0) {
      data.push({
        id: 4,
        text: "Everything is completed. Take a short break 🎉",
      });
    }

    if (data.length === 0) {
      data.push({
        id: 5,
        text: "You're doing well. Keep your momentum going!",
      });
    }

    setSuggestions(data);
  };

  return (
    <div className="glass-card ai-card">
      <div className="ai-header">
        <FaLightbulb className="ai-icon" />
        <h3>AI Suggestions</h3>
      </div>

      {suggestions.map((item) => (
        <div className="ai-suggestion" key={item.id}>
          <span>{item.text}</span>

          <div className="ai-buttons">
            <button className="ai-accept">
              <FaCheck />
            </button>

            <button className="ai-ignore">
              <FaTimes />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}