import API from "../app/api";

export const askCopilot = async (message, history, tasks) => {
  try {
    const res = await API.post("/ai/copilot", { message, history, tasks });
    return { success: true, reply: res.data.reply };
  } catch (error) {
    console.error("Copilot Error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.error || error.message };
  }
};