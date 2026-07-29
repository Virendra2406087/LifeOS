import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { Toaster } from "react-hot-toast";

import Layout      from "./components/layout/Layout";
import LandingPage from "./pages/LandingPage";
import Dashboard   from "./pages/Dashboard";
import Tasks       from "./pages/Tasks";
import Analytics   from "./pages/Analytics";
import History     from "./pages/History";
import BellIcon    from "./pages/NotificationBell";
import Settings    from "./pages/Settings";
import Profile     from "./pages/Profile";
import Login           from "./pages/Login";
import Register        from "./pages/Register";
import GoogleCallback  from "./pages/GoogleCallback";
const API_URL = import.meta.env.VITE_API_URL;

function Protected({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

// Must match EnergyCard.jsx's threshold/formula
const ENERGY_COST_PER_TASK = 15;
const LOW_ENERGY_THRESHOLD = 40;

export default function App() {

  const [tasks, setTasks] = useState([]);
  const [energyBoost, setEnergyBoost] = useState(0);
  const [earnedTips, setEarnedTips] = useState([]);
  const [mode, setMode] = useState("Normal");
  const [autoTriggered, setAutoTriggered] = useState(false);

  const todayStr    = new Date().toDateString();
  const todaysTasks = tasks.filter(t => t.date && new Date(t.date).toDateString() === todayStr);
  const completed   = todaysTasks.filter(t => t.completed).length;
  const taskPercent = Math.max(0, 100 - completed * ENERGY_COST_PER_TASK);
  const energyPct   = Math.min(100, taskPercent + (energyBoost || 0));

  useEffect(() => {
    if (energyPct < LOW_ENERGY_THRESHOLD) {
      if (!autoTriggered && mode !== "Low Energy") {
        setMode("Low Energy");
        setAutoTriggered(true);
      }
    } else if (autoTriggered) {
      setMode("Normal");
      setAutoTriggered(false);
    }
  }, [energyPct, autoTriggered, mode]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios
      .get(`${API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setTasks(res.data))
      .catch(err => {
        console.log(err);
        if (err.response?.status === 401) {
          localStorage.clear();
          window.location.href = "/login";
        }
      });
  }, []);

  const addTask = async (taskData) => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        `${API_URL}/api/tasks`,
        taskData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(prev => [...prev, res.data]);
      return res.data;
    } catch (err) {
      console.log(err);
      throw err;
    }
  };

  const toggleTask = async (id) => {
    const token = localStorage.getItem("token");
    const task = tasks.find(t => (t._id || t.id) === id);
    if (!task) return;

    setTasks(prev =>
      prev.map(t => (t._id || t.id) === id ? { ...t, completed: !t.completed } : t)
    );

    try {
      const res = await axios.put(
        `${API_URL}/api/tasks/${id}`,
        { completed: !task.completed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(prev =>
        prev.map(t => (t._id || t.id) === id ? res.data : t)
      );
    } catch (err) {
      console.log(err);
      setTasks(prev =>
        prev.map(t => (t._id || t.id) === id ? { ...t, completed: task.completed } : t)
      );
    }
  };

  const deleteTask = async (id) => {
    const token = localStorage.getItem("token");
    const prevTasks = tasks;

    setTasks(prev => prev.filter(t => (t._id || t.id) !== id));

    try {
      await axios.delete(`${API_URL}/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.log(err);
      setTasks(prevTasks); 
    }
  };
  const withLayout = (children) => (
    <Protected>
      <Layout
        tasks={tasks}
        setTasks={setTasks}
        energyBoost={energyBoost}
        setEnergyBoost={setEnergyBoost}
        earnedTips={earnedTips}
        setEarnedTips={setEarnedTips}
        mode={mode}
        setMode={setMode}
      >
        {children}
      </Layout>
    </Protected>
  );

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/"              element={<LandingPage />} />
        <Route path="/auth/callback" element={<GoogleCallback />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/register"      element={<Register />} />
        <Route
          path="/dashboard"
          element={withLayout(
            <Dashboard tasks={tasks} setTasks={setTasks} energyBoost={energyBoost} />
          )}
        />
        <Route
          path="/tasks"
          element={withLayout(
            <Tasks
              tasks={tasks}
              addTask={addTask}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
            />
          )}
        />
        <Route path="/analytics"     element={withLayout(<Analytics tasks={tasks} />)} />
        <Route path="/history"       element={withLayout(<History tasks={tasks} />)} />
        <Route path="/settings"      element={withLayout(<Settings />)} />
        <Route path="/profile"       element={withLayout(<Profile tasks={tasks} />)} />
        <Route path="/notifications" element={withLayout(<BellIcon tasks={tasks} />)} />
      </Routes>
    </BrowserRouter>
  );
}