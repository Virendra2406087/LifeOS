import {
  FaBrain,
  FaArrowUp,
  FaExclamationTriangle,
} from "react-icons/fa";

import useAIPriority from "../../hooks/useAIPriority";

export default function AIPriorityCard({ tasks }) {
  const { priorityTasks, loading } = useAIPriority(tasks);

  const getColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "#ef4444";
      case "High":
        return "#f97316";
      case "Medium":
        return "#eab308";
      default:
        return "#22c55e";
    }
  };

  return (
    <div className="glass-card ai-priority-card">

      <div className="priority-header">
        {/* <FaBrain className="priority-icon" /> */}
          <span className="lifeos-ai-icon">
      ✨
    </span>
        <h3>AI Priority Engine</h3>

      </div>

      {loading ? (
        <p>Analyzing tasks...</p>
      ) : priorityTasks.length === 0 ? (
        <p>No tasks available.</p>
      ) : (
        priorityTasks.map((task, index) => (
          <div
            key={index}
            className="priority-item"
            style={{
              borderLeft: `5px solid ${getColor(task.ai.priority)}`
            }}
          >
            <div>
              <h4>{task.text}</h4>

              <small>
                Score : {task.ai.score}
              </small>
            </div>

            <div
              className="priority-badge"
              style={{
                background: getColor(task.ai.priority)
              }}
            >
              <FaArrowUp />
              {task.ai.priority}
            </div>
          </div>
        ))
      )}

      <div className="priority-footer">
        <FaExclamationTriangle />
        Tasks are automatically ranked by AI.
      </div>

    </div>
  );
}