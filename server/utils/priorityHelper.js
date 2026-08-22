// =====================================================
// Calculate task duration
// =====================================================

const calculateDuration = (startTime, endTime) => {

  if (!startTime || !endTime) {
    return 0;
  }

  const [startHour, startMinute] =
    startTime.split(":").map(Number);

  const [endHour, endMinute] =
    endTime.split(":").map(Number);


  const start =
    startHour * 60 + startMinute;

  const end =
    endHour * 60 + endMinute;


  let duration = end - start;


  // Task crosses midnight
  if (duration < 0) {
    duration += 24 * 60;
  }


  return duration;
};


// =====================================================
// Calculate deadline in hours
// =====================================================

const calculateDeadlineHours = (
  date,
  startTime
) => {

  if (!date || !startTime) {
    return 0;
  }


  const [year, month, day] =
    date.split("-").map(Number);

  const [hour, minute] =
    startTime.split(":").map(Number);


  const deadline = new Date(
    year,
    month - 1,
    day,
    hour,
    minute
  );


  const now = new Date();


  const difference =
    deadline.getTime() -
    now.getTime();


  return Math.max(
    0,
    difference / (1000 * 60 * 60)
  );
};


module.exports = {
  calculateDuration,
  calculateDeadlineHours
};

const PRIORITY_MAP = { Critical: 4, High: 3, Medium: 2, Low: 1 };

const priorityToNumber = (priority) => PRIORITY_MAP[priority] ?? 2;

const hoursUntil = (deadline) => {
  if (!deadline) return 24;
  const diffMs = new Date(deadline) - new Date();
  return Math.max(0, diffMs / (1000 * 60 * 60));
};

module.exports = {
  // ...keep your existing exports (calculateDuration, calculateDeadlineHours)
  priorityToNumber,
  hoursUntil,
};