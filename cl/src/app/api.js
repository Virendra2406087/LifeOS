import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_URL,
});

API.interceptors.request.use(async (req) => {
  try {
    const token = await window.Clerk?.session?.getToken();
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error("Failed to get Clerk session token:", err);
  }
  return req;
});

export default API;