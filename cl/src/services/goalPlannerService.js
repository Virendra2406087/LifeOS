import API from "../app/api";

export const generateGoalPlan = async (goal) => {
  try {
    const res = await API.post("/ai/goal-plan", { goal });
    return { success: true, plan: res.data.plan };
  } catch (error) {
    console.error("Goal Planner Error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.error || error.message };
  }
};