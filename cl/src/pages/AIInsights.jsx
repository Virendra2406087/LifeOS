export default function AIInsights({ tasks }) {

  const completed = tasks.filter(
    (t) => t.status === "done"
  ).length;

  const score = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  let message = "Good progress 👍";

  if (score > 80) message = "Amazing productivity 🚀";
  else if (score < 40) message = "Try focusing more 💡";

  return (

    <div className="glass-card ai-panel">

      <h3>🧠 AI Productivity Insights</h3>

      <p>
        Productivity Score: <b>{score}%</b>
      </p>

      <p>{message}</p>

    </div>

  );

}