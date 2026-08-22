// server/services/priorityAIService.js

const PRIORITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

function getHoursRemaining(deadline) {
  if (!deadline) return 9999;

  const now = new Date();
  const due = new Date(deadline);

  return (due - now) / (1000 * 60 * 60);
}

function calculatePriority(task) {
  let score = 0;

  // Deadline
  const hours = getHoursRemaining(task.deadline);

  if (hours <= 2) score += 60;
  else if (hours <= 6) score += 45;
  else if (hours <= 24) score += 30;
  else if (hours <= 72) score += 15;

  // Importance
  switch (task.importance) {
    case "High":
      score += 30;
      break;

    case "Medium":
      score += 20;
      break;

    case "Low":
      score += 10;
      break;

    default:
      score += 10;
  }

  // Estimated duration
  if (task.duration <= 30)
    score += 5;

  else if (task.duration <= 60)
    score += 10;

  else
    score += 15;

  // Category boost
  if (task.category === "Meeting")
    score += 20;

  if (task.category === "Work")
    score += 15;

  if (task.category === "Study")
    score += 10;

  // Overdue
  if (hours < 0)
    score += 100;

  let priority = PRIORITY.LOW;

  if (score >= 90)
    priority = PRIORITY.CRITICAL;

  else if (score >= 70)
    priority = PRIORITY.HIGH;

  else if (score >= 40)
    priority = PRIORITY.MEDIUM;

  return {
    score,
    priority,
  };
}

function sortTasks(tasks) {
  return tasks
    .map(task => ({
      ...task,
      ai: calculatePriority(task),
    }))
    .sort((a, b) => b.ai.score - a.ai.score);
}

module.exports = {
  calculatePriority,
  sortTasks,
};