import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useState, useEffect } from "react";
import axios from "axios";
import { Toaster } from "react-hot-toast";

import { useAuth } from "@clerk/react";

import Layout from "./components/layout/Layout";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Analytics from "./pages/Analytics";
import History from "./pages/History";
import BellIcon from "./pages/NotificationBell";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";

import Login from "./pages/Login";
import Register from "./pages/Register";
import SSOCallback from "./pages/SSOCallback";

import { AIPanelProvider } from "./context/AIPanelContext";

const API_URL = import.meta.env.VITE_API_URL;


// ======================================================
// CLERK PROTECTED ROUTE
// ======================================================

function Protected({ children }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


// ======================================================
// ENERGY SETTINGS
// ======================================================

const ENERGY_COST_PER_TASK = 15;
const LOW_ENERGY_THRESHOLD = 40;


// ======================================================
// APP
// ======================================================

function AppContent() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [energyBoost, setEnergyBoost] = useState(0);
  const [earnedTips, setEarnedTips] = useState([]);
  const [mode, setMode] = useState("Normal");
  const [autoTriggered, setAutoTriggered] = useState(false);

  const todayStr = new Date().toDateString();

  const todaysTasks = tasks.filter(
    (t) => t.date && new Date(t.date).toDateString() === todayStr
  );

  const completed = todaysTasks.filter((t) => t.completed).length;

  const taskPercent = Math.max(0, 100 - completed * ENERGY_COST_PER_TASK);
  const energyPct = Math.min(100, taskPercent + (energyBoost || 0));

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
    if (!isLoaded || !isSignedIn) return;

    const loadTasks = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${API_URL}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(res.data);
      } catch (err) {
        console.log("Failed to load tasks:", err);
        if (err.response?.status === 401) {
          console.log("Clerk authentication failed");
        }
      }
    };

    loadTasks();
  }, [isLoaded, isSignedIn, getToken]);

  const addTask = async (taskData) => {
    try {
      const token = await getToken();
      const res = await axios.post(`${API_URL}/tasks`, taskData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((prev) => [...prev, res.data]);
      return res.data;
    } catch (err) {
      console.log(err);
      throw err;
    }
  };

  const toggleTask = async (id) => {
    try {
      const token = await getToken();
      const task = tasks.find((t) => (t._id || t.id) === id);
      if (!task) return;

      setTasks((prev) =>
        prev.map((t) => ((t._id || t.id) === id ? { ...t, completed: !t.completed } : t))
      );

      const res = await axios.put(
        `${API_URL}/tasks/${id}`,
        { completed: !task.completed },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTasks((prev) => prev.map((t) => ((t._id || t.id) === id ? res.data : t)));
    } catch (err) {
      console.log(err);
      setTasks((prev) =>
        prev.map((t) => ((t._id || t.id) === id ? { ...t, completed: !t.completed } : t))
      );
    }
  };

  const deleteTask = async (id) => {
    const previousTasks = tasks;
    try {
      const token = await getToken();
      setTasks((prev) => prev.filter((t) => (t._id || t.id) !== id));
      await axios.delete(`${API_URL}/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.log(err);
      setTasks(previousTasks);
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
    <>
      <Toaster position="top-right" />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/sso-callback" element={<SSOCallback />} />

        <Route
          path="/dashboard"
          element={withLayout(
            <Dashboard tasks={tasks} setTasks={setTasks} energyBoost={energyBoost} />
          )}
        />
        <Route
          path="/tasks"
          element={withLayout(
            <Tasks tasks={tasks} addTask={addTask} toggleTask={toggleTask} deleteTask={deleteTask} />
          )}
        />
        <Route path="/analytics" element={withLayout(<Analytics tasks={tasks} />)} />
        <Route path="/history" element={withLayout(<History tasks={tasks} />)} />
        <Route path="/settings" element={withLayout(<Settings />)} />
        <Route path="/profile" element={withLayout(<Profile tasks={tasks} />)} />
        <Route path="/notifications" element={withLayout(<BellIcon tasks={tasks} />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AIPanelProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AIPanelProvider>
  );
}