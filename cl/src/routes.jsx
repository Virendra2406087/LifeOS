import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import FocusBar from "../dashboard/FocusBar";

export default function Layout({ tasks = [], children }) {

  const [mode, setMode]           = useState("Normal");
  const [focusMode, setFocusMode] = useState(false);
  const [focusTime, setFocusTime] = useState(25);
  const [showSetup, setShowSetup] = useState(false);

  const startFocus = () => { setFocusMode(true);  setShowSetup(false); };
  const exitFocus  = () => { setFocusMode(false); setShowSetup(false); };

  return (
    <div className="app-layout">

      <Sidebar />

      <div className="main-layout">

        <Navbar tasks={tasks} mode={mode} setMode={setMode} />

        {/* Focus mode setup trigger */}
        {mode === "Focus Mode" && !focusMode && !showSetup && (
          <div style={{ padding: "10px 20px" }}>
            <button onClick={() => setShowSetup(true)}>Focus Mode 🔥</button>
          </div>
        )}

        {/* Focus time picker */}
        {mode === "Focus Mode" && showSetup && !focusMode && (
          <div style={{ padding: "10px 20px", display: "flex", gap: 10, alignItems: "center" }}>
            <label>Focus Time (minutes):</label>
            <input
              type="number"
              value={focusTime}
              min="5"
              max="120"
              onChange={(e) => setFocusTime(e.target.value)}
              style={{ width: 70 }}
            />
            <button onClick={startFocus}>Start</button>
            <button onClick={() => setShowSetup(false)}>Cancel</button>
          </div>
        )}

        {/* Focus bar timer */}
        {mode === "Focus Mode" && focusMode && (
          <FocusBar minutes={focusTime} exitFocus={exitFocus} />
        )}

        <div className="page">
          {children}
        </div>

      </div>
    </div>
  );
}