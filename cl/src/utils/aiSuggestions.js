// Parse "9:00 AM" or "2:30 PM" → hour in 24h format
function parseHour(timeStr) {
  if (!timeStr) return null;
  const [time, period] = timeStr.trim().split(" ");
  let [hours] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours;
}

// Get start hour from a time range like "9:00 AM - 9:20 AM"
function getStartHour(task) {
  if (!task.time) return null;
  const startPart = task.time.split(" - ")[0];
  return parseHour(startPart);
}

export function generateSuggestions(tasks) {
  const suggestions = [];

  if (tasks.length === 0) return suggestions;

  // Rule 1: too many tasks before noon
  const morningTasks = tasks.filter((t) => {
    const h = getStartHour(t);
    return h !== null && h < 12;
  });
  if (morningTasks.length > 3) {
    suggestions.push("Too many morning tasks. Move one to afternoon.");
  }

  // Rule 2: no break scheduled
  const hasBreak = tasks.some((t) =>
    t.text?.toLowerCase().includes("break")
  );
  if (!hasBreak) {
    suggestions.push("Add a short break to maintain productivity.");
  }

  // Rule 3: long gap between consecutive tasks (> 3 hours)
  const sorted = [...tasks]
    .map((t) => ({ ...t, _hour: getStartHour(t) }))
    .filter((t) => t._hour !== null)
    .sort((a, b) => a._hour - b._hour);

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1]._hour - sorted[i]._hour > 3) {
      suggestions.push("You have a long gap. Add a small task.");
      break;
    }
  }

  return suggestions;
}