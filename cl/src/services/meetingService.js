// src/services/meetingService.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL  || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});

// attach auth token if you're using JWT (same pattern as your other services)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function getMeetings() {
  try {
    const res = await api.get("/api/meetings/today");
    return res.data;
  } catch (err) {
    console.error("getMeetings failed:", err.message);
    throw err; // let the component decide fallback behavior
  }
}

export async function createMeeting(meetingData) {
  try {
    const res = await api.post("/api/meetings", meetingData);
    return res.data;
  } catch (err) {
    console.error("createMeeting failed:", err.message);
    throw err;
  }
}

export async function updateMeeting(id, meetingData) {
  try {
    const res = await api.put(`/api/meetings/${id}`, meetingData);
    return res.data;
  } catch (err) {
    console.error("updateMeeting failed:", err.message);
    throw err;
  }
}

export async function deleteMeeting(id) {
  try {
    const res = await api.delete(`/api/meetings/${id}`);
    return res.data;
  } catch (err) {
    console.error("deleteMeeting failed:", err.message);
    throw err;
  }
}