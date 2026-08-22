import { FaExclamationTriangle } from "react-icons/fa";

export default function ConflictDetector({ tasks = [] }) {

  const conflicts = [];

  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {

      if (
        tasks[i].date === tasks[j].date &&
        tasks[i].time === tasks[j].time
      ) {
        conflicts.push({
          first: tasks[i],
          second: tasks[j]
        });
      }

    }
  }

  return (
    <div className="glass-card conflict-card">

      <div className="conflict-header">
        <FaExclamationTriangle />
        <h3>AI Conflict Detector</h3>
      </div>

      {conflicts.length === 0 ? (

        <p>No scheduling conflicts 🎉</p>

      ) : (

        conflicts.map((item, index) => (

          <div
            className="conflict-item"
            key={index}
          >

            <h4>{item.first.text}</h4>

            <p>conflicts with</p>

            <h4>{item.second.text}</h4>

            <button>
              Suggest New Time
            </button>

          </div>

        ))

      )}

    </div>
  );

}