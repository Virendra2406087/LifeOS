import { getActiveDates } from "./history";

export const calculateStreak = () => {
  const activeDates = new Set(getActiveDates());

  if (activeDates.size === 0) {
    return { current: 0, longest: 0, activeToday: false };
  }

  const oneDay = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toDateString();
  const yesterday = new Date(today.getTime() - oneDay);
  const yesterdayStr = yesterday.toDateString();

  const activeToday = activeDates.has(todayStr);

  // Current streak: walk backwards from today (or yesterday, if today has no activity yet)
  let current = 0;
  if (activeToday || activeDates.has(yesterdayStr)) {
    let cursor = activeToday ? today : yesterday;
    while (activeDates.has(cursor.toDateString())) {
      current++;
      cursor = new Date(cursor.getTime() - oneDay);
    }
  }

  // Longest streak ever: sort all active dates and find the longest consecutive run
  const sortedDates = [...activeDates].map(d => new Date(d)).sort((a, b) => a - b);

  let longest = 0;
  let run = 0;
  let prevDate = null;

  for (const d of sortedDates) {
    run = prevDate && d - prevDate === oneDay ? run + 1 : 1;
    longest = Math.max(longest, run);
    prevDate = d;
  }

  return { current, longest, activeToday };
};