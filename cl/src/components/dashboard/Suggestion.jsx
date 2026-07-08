export default function Suggestion({ tasks }) {

  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;

  let message = "";

  if (total === 0)
    message = "Start by adding your first task 🚀";

  else if (completed === total)
    message = "Amazing! You finished everything today 🎉";

  else if (completed / total > 0.7)
    message = "Great progress! Keep pushing 💪";

  else
    message = "Focus on finishing one task at a time 🧠";

  return (

    <div className="ai-box">

      <h3>AI Productivity Coach</h3>

      <p>{message}</p>

    </div>

  );

}