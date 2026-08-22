import API from "../app/api";

const callBackend = async (endpoint, data, label) => {
  try {
    const response = await API.post(`/ml/${endpoint}`, data);
    return response.data;
  } catch (error) {
    console.error(`${label} Error:`, error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

export const predictProductivity = (data) => callBackend("productivity", data, "Productivity");
export const predictPriority = (data) => callBackend("priority", data, "Priority");
export const predictScheduler = (data) => callBackend("scheduler", data, "Scheduler");
export const predictBurnout = (data) => callBackend("burnout", data, "Burnout");
export const predictHabits = (data) => callBackend("habits", data, "Habits");
export const predictSchedulerTask = (data) => callBackend("scheduler/task", data, "Scheduler");
export const predictDurationTask = (data) => callBackend("duration/task", data, "Duration");