const {
  predictPriority,
  predictProductivity,
  predictScheduler,
  predictBurnout,
  predictHabits,
  predictDuration,
} = require("../services/mlService");

const {
  calculateDuration,
  calculateDeadlineHours,
} = require("../utils/priorityHelper");

const missingFields = (body, fields) =>
  fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === "");


// =====================================================
// PRODUCTIVITY
// =====================================================

exports.getProductivityPrediction = async (req, res) => {
  const missing = missingFields(req.body, [
    "tasks_completed", "tasks_pending", "focus_hours", "breaks", "meetings",
  ]);

  if (missing.length) {
    return res.status(400).json({
      success: false,
      message: `Missing fields: ${missing.join(", ")}`,
    });
  }

  try {
    const result = await predictProductivity(req.body);
    res.json(result);
  } catch (err) {
    console.error("Productivity prediction error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};


// =====================================================
// PRIORITY - DIRECT
// =====================================================

exports.getPriorityPrediction = async (req, res) => {
  try {
    const result = await predictPriority(req.body);
    res.json(result);
  } catch (err) {
    console.error("Priority prediction error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// =====================================================
// DURATION - TASK
// =====================================================

exports.predictTaskDuration = async (req, res) => {
  try {
    const { importance, category, text, deadline } = req.body;

    if (importance === undefined || category === undefined) {
      return res.status(400).json({ success: false, message: "importance and category are required" });
    }

    const task_length = (text || "").trim().split(/\s+/).filter(Boolean).length || 1;
    const deadline_hours = hoursUntil(deadline);

    const payload = {
      importance: priorityToNumber(importance), // was: Number(importance) — broke on strings like "High"
      task_length,
      category: Number(category),
      deadline_hours,
    };

    const result = await predictDuration(payload);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      model: "duration",
      prediction: result.prediction,
      features: payload,
    });
  } catch (err) {
    console.error("Task duration prediction error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// =====================================================
// PRIORITY - TASK  (unchanged from your version)
// =====================================================

exports.predictTaskPriority = async (req, res) => {
  try {
    const { importance, category, date, startTime, endTime } = req.body;

    if (importance === undefined || category === undefined || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: "Missing required task fields" });
    }

    const duration = calculateDuration(startTime, endTime);
    const deadline_hours = calculateDeadlineHours(date, startTime);

    const values = [Number(importance), Number(deadline_hours), Number(duration), Number(category)];

    const result = await predictPriority({ values });

    res.json({
      success: true,
      model: "priority",
      prediction: result.prediction,
      features: {
        importance: Number(importance),
        deadline_hours,
        duration,
        category: Number(category),
      },
    });
  } catch (err) {
    console.error("Task priority prediction error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// =====================================================
// SCHEDULER
// =====================================================

exports.getSchedulerPrediction = async (req, res) => {
  const missing = missingFields(req.body, ["priority", "energy_level", "deadline_hours", "duration"]);

  if (missing.length) {
    return res.status(400).json({
      success: false,
      message: `Missing fields: ${missing.join(", ")}`,
    });
  }

  try {
    const result = await predictScheduler(req.body);
    res.json(result);
  } catch (err) {
    console.error("Scheduler prediction error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};


// =====================================================
// BURNOUT
// =====================================================

exports.getBurnoutPrediction = async (req, res) => {
  const missing = missingFields(req.body, [
    "tasks_completed", "tasks_pending", "focus_hours", "break_hours", "sleep_hours", "stress_level",
  ]);

  if (missing.length) {
    return res.status(400).json({
      success: false,
      message: `Missing fields: ${missing.join(", ")}`,
    });
  }

  try {
    const result = await predictBurnout(req.body);
    res.json(result);
  } catch (err) {
    console.error("Burnout prediction error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};


// =====================================================
// HABITS
// =====================================================

exports.getHabitPrediction = async (req, res) => {
  const missing = missingFields(req.body, [
    "sleep_hours", "exercise_minutes", "study_hours", "screen_time", "water_intake",
  ]);

  if (missing.length) {
    return res.status(400).json({
      success: false,
      message: `Missing fields: ${missing.join(", ")}`,
    });
  }

  try {
    const result = await predictHabits(req.body);
    res.json(result);
  } catch (err) {
    console.error("Habit prediction error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const { priorityToNumber, hoursUntil } = require("../utils/priorityHelper");

// =====================================================
// SCHEDULER - TASK
// =====================================================

exports.predictTaskScheduler = async (req, res) => {
  try {
    const { priority, deadline, text, duration, energy_level } = req.body;

    const estimateTime = (t = "") => {
      t = t.toLowerCase();
      if (t.includes("meeting")) return 60;
      if (t.includes("study")) return 90;
      if (t.includes("assignment")) return 120;
      if (t.includes("project")) return 180;
      if (t.includes("gym")) return 60;
      if (t.includes("call")) return 20;
      return 45;
    };

    const payload = {
      priority: priorityToNumber(priority),
      energy_level: energy_level ?? 3, // placeholder until real energy data is wired in
      deadline_hours: hoursUntil(deadline),
      duration: duration ?? estimateTime(text),
    };

    const result = await predictScheduler(payload);

    if (!result.success) {
      return res.status(500).json(result);
    }

    const bestHour = result.prediction;
    const displayHour = bestHour % 12 === 0 ? 12 : bestHour % 12;
    const period = bestHour >= 12 ? "PM" : "AM";

    res.json({
      success: true,
      model: "scheduler",
      best_hour_24: bestHour,
      best_hour_display: `${displayHour}:00 ${period}`,
      features: payload,
    });
  } catch (err) {
    console.error("Task scheduler prediction error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};