import axios from "axios";
import { API_URL } from "../config";
const API = `${API_URL}/api/ai`;

export const getPriorityTasks = async (tasks) => {
  try {
    const response = await axios.post(`${API}/priority`, {
      tasks,
    });

    return response.data.tasks;
  } catch (error) {
    console.error("AI Priority Error:", error);
    return [];
  }
};