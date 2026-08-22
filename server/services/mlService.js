const axios = require("axios");

if (!process.env.ML_API_URL) {
  console.warn("ML_API_URL not set — falling back to http://localhost:8000");
}
const ML_API = process.env.ML_API_URL || "http://localhost:8000";

const callMlApi = async (endpoint, data, label) => {
  try {
    const response = await axios.post(`${ML_API}/predict/${endpoint}`, data, {
      timeout: 20000, // covers Render free-tier cold start
    });
    return response.data;
  } catch (error) {
    console.error(`${label} ML API Error:`, error.response?.data || error.message);
    throw new Error(`Unable to connect to ${label.toLowerCase()} ML service`);
  }
};

const predictProductivity = (data) => callMlApi("productivity", data, "Productivity");
const predictPriority = (data) => callMlApi("priority", data, "Priority");
const predictScheduler = (data) => callMlApi("scheduler", data, "Scheduler");
const predictBurnout = (data) => callMlApi("burnout", data, "Burnout");
const predictHabits = (data) => callMlApi("habits", data, "Habits");
const predictDuration = (data) => callMlApi("duration", data, "Duration");

module.exports = {
  predictProductivity,
  predictPriority,
  predictScheduler,
  predictBurnout,
  predictHabits,
  predictDuration,
};