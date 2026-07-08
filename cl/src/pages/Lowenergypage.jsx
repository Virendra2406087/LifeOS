import { useState, useEffect, useCallback, useRef } from "react";
import { FaRobot, FaSyncAlt, FaCheck, FaTimes, FaBatteryQuarter, FaPlay, FaPause, FaRedo, FaForward } from "react-icons/fa";
import { fetchAISuggestions } from "../services/aiService";

const QUICK_TIPS = [
  { icon: "💧", tip: "Drink a full glass of water",         boost: 5,  mins: 5  },
  { icon: "🧘", tip: "Take deep breaths to reset focus",    boost: 8,  mins: 5  },
  { icon: "🚶", tip: "Walk around to boost energy",         boost: 12, mins: 10 },
  { icon: "🎵", tip: "Put on calm music to reduce stress",  boost: 6,  mins: 5  },
  { icon: "😴", tip: "Take a power nap",                    boost: 20, mins: 20 },
  { icon: "🍎", tip: "Eat a light healthy snack",           boost: 10, mins: 5  },
];

const MOOD_TASKS = [
  { icon: "📖", text: "Read for 10 minutes",          priority: "gray" },
  { icon: "🧹", text: "Tidy up your workspace",       priority: "gray" },
  { icon: "📝", text: "Write tomorrow's top 3 goals", priority: "blue" },
  { icon: "🌿", text: "Step outside for fresh air",   priority: "gray" },
  { icon: "📧", text: "Clear your email inbox",       priority: "blue" },
  { icon: "🎯", text: "Review your weekly goals",     priority: "blue" },
];

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// Circular ring geometry
const RING_SIZE   = 220;
const RING_STROKE = 10;
const RING_R      = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC   = 2 * Math.PI * RING_R;

// Must match EnergyCard.jsx's ENERGY_COST_PER_TASK so both places agree
const ENERGY_COST_PER_TASK = 15;

export default function LowEnergyPage({ tasks = [], setTasks, earned = [], setEarned, onBoostChange }) {

  const [suggestions, setSuggestions] = useState([]);
  const [ignored, setIgnored]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [accepted, setAccepted]       = useState([]);
  const [addedMoods, setAddedMoods]   = useState([]);

  // ── Session state ──
  const [queued, setQueued]           = useState([]);   // tip indices selected
  const [sessionOn, setSessionOn]     = useState(false);
  const [paused, setPaused]           = useState(false);
  const [curStep, setCurStep]         = useState(0);    // index in queued array
  const [secsLeft, setSecsLeft]       = useState(0);
  const [flashBoost, setFlashBoost]   = useState(null);
  const [minsFocused, setMinsFocused] = useState(0);     // total minutes completed this session
  const intervalRef                   = useRef(null);

  const todayStr       = new Date().toDateString();
  const todaysTasks    = tasks.filter(t => t.date && new Date(t.date).toDateString() === todayStr);
  const completedToday = todaysTasks.filter(t => t.completed).length;
  const totalToday     = todaysTasks.length;
  // Energy starts full and drains as tasks are completed (effort spent),
  // independent of how many tasks exist or get created.
  const taskPct        = Math.max(0, 100 - completedToday * ENERGY_COST_PER_TASK);
  const tipBoost       = earned.reduce((sum, i) => sum + QUICK_TIPS[i].boost, 0);
  const energyPct      = Math.min(100, taskPct + tipBoost);

  const pendingBoost   = queued
    .filter(i => !earned.includes(i))
    .reduce((sum, i) => sum + QUICK_TIPS[i].boost, 0);

  const totalQueueMins = queued.reduce((sum, i) => sum + QUICK_TIPS[i].mins, 0);

  const energyColor = energyPct >= 70 ? "#10b981" : energyPct >= 40 ? "#f59e0b" : "#ef4444";
  const energyLabel = energyPct >= 70 ? "High 🚀" : energyPct >= 40 ? "Medium ⚡" : "Low 😴";

  // Report the earned tip boost up to the parent (App.jsx's shared energyBoost
  // state) any time it changes, so the Dashboard's EnergyCard stays in sync.
  useEffect(() => {
    if (onBoostChange) onBoostChange(tipBoost);
  }, [tipBoost, onBoostChange]);

  // ── Timer tick ──
  useEffect(() => {
    if (!sessionOn || paused) return;
    intervalRef.current = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) {
          // current tip done
          const doneIdx = queued[curStep];
          setEarned(prev => [...prev, doneIdx]);
          setMinsFocused(m => m + QUICK_TIPS[doneIdx].mins);
          setFlashBoost(`+${QUICK_TIPS[doneIdx].boost}%`);
          setTimeout(() => setFlashBoost(null), 1600);

          const nextStep = curStep + 1;
          if (nextStep < queued.length) {
            setCurStep(nextStep);
            return QUICK_TIPS[queued[nextStep]].mins * 60;
          } else {
            // session complete
            setSessionOn(false);
            setCurStep(0);
            clearInterval(intervalRef.current);
            return 0;
          }
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [sessionOn, paused, curStep, queued]);

  const toggleQueue = (i) => {
    if (sessionOn) return;
    if (earned.includes(i)) return;
    setQueued(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  };

  const startSession = () => {
    if (queued.length === 0) return;
    const firstUnearned = queued.filter(i => !earned.includes(i));
    if (firstUnearned.length === 0) return;
    setCurStep(0);
    setSecsLeft(QUICK_TIPS[queued[0]].mins * 60);
    setSessionOn(true);
    setPaused(false);
    setMinsFocused(0);
  };

  const stopSession = () => {
    clearInterval(intervalRef.current);
    setSessionOn(false);
    setPaused(false);
    setCurStep(0);
    setSecsLeft(0);
  };

  // Restart the timer for the current step, keeping the session running
  const resetStep = () => {
    if (!sessionOn) return;
    const tipIdx = queued[curStep];
    setSecsLeft(QUICK_TIPS[tipIdx].mins * 60);
  };

  // Jump ahead to the next queued tip without earning the current one's boost
  const skipStep = () => {
    if (!sessionOn) return;
    const nextStep = curStep + 1;
    if (nextStep < queued.length) {
      setCurStep(nextStep);
      setSecsLeft(QUICK_TIPS[queued[nextStep]].mins * 60);
    } else {
      stopSession();
    }
  };

  const activeTipIdx  = sessionOn ? queued[curStep] : null;
  const activeTip     = activeTipIdx != null ? QUICK_TIPS[activeTipIdx] : null;
  const sessionTotal  = activeTip ? activeTip.mins * 60 : 0;
  const sessionPct    = sessionTotal > 0 ? ((sessionTotal - secsLeft) / sessionTotal) * 100 : 0;
  const ringOffset    = RING_CIRC * (1 - sessionPct / 100);

  const loadSuggestions = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res   = await fetchAISuggestions(tasks, "low_energy");
      const fresh = (res.data.suggestions || []).filter(s => !ignored.includes(s));
      setSuggestions(fresh);
    } catch { setError("Could not load suggestions. Try again."); }
    finally  { setLoading(false); }
  }, [tasks, ignored]);

  useEffect(() => { loadSuggestions(); }, []);

  const handleAccept = (s) => {
    setAccepted(p => [...p, s]);
    setIgnored(p => [...p, s]);
    setSuggestions(p => p.filter(x => x !== s));
    if (setTasks) setTasks(p => [...p, {
      id: Date.now(), text: s, priority: "blue", completed: false,
      date: new Date().toISOString().split("T")[0], startTime: "", endTime: ""
    }]);
  };

  const handleIgnore = (s) => {
    setIgnored(p => [...p, s]);
    setSuggestions(p => p.filter(x => x !== s));
  };

  const addMoodTask = (task) => {
    if (addedMoods.includes(task.text)) return;
    setAddedMoods(p => [...p, task.text]);
    if (setTasks) setTasks(p => [...p, {
      id: Date.now(), text: task.text, priority: task.priority, completed: false,
      date: new Date().toISOString().split("T")[0], startTime: "", endTime: ""
    }]);
  };

  return (
    <div style={{ color: "white", maxWidth: 860, margin: "0 auto", padding: "0 4px" }}>

      <style>{`
        @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes boostPop { 0%{opacity:0;transform:translateY(4px) scale(0.8)} 30%{opacity:1;transform:translateY(-20px) scale(1.15)} 100%{opacity:0;transform:translateY(-40px) scale(0.9)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes ringGlow { 0%,100%{filter:drop-shadow(0 0 6px rgba(124,58,237,0.5))} 50%{filter:drop-shadow(0 0 14px rgba(124,58,237,0.85))} }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, flexWrap: "wrap", gap: 12
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg,rgba(16,185,129,0.2),rgba(5,150,105,0.1))",
            border: "1px solid rgba(16,185,129,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22
          }}>🌙</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Low Energy Mode</h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>
              Queue tips → start timer → earn energy boosts
            </p>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: 100, padding: "8px 16px"
        }}>
          <FaBatteryQuarter color="#f59e0b" size={14} />
          <span style={{ fontSize: 13, color: "#f59e0b", fontWeight: 700 }}>
            {completedToday}/{totalToday} tasks · +{tipBoost}% earned
          </span>
        </div>
      </div>

      {/* ── Energy meter ── */}
      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${energyColor}44`,
        borderRadius: 16, padding: "20px 24px", marginBottom: 16,
        position: "relative", overflow: "hidden"
      }}>

        {/* Boost flash */}
        {flashBoost && (
          <div style={{
            position: "absolute", top: 20, right: 24, fontSize: 24,
            fontWeight: 800, color: "#10b981",
            animation: "boostPop 1.6s ease forwards", pointerEvents: "none", zIndex: 10
          }}>
            {flashBoost}
          </div>
        )}

        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-end", marginBottom: 14
        }}>
          <div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 4px" }}>
              Current energy
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontSize: 40, fontWeight: 800, color: energyColor, lineHeight: 1 }}>
                {energyPct}%
              </span>
              <span style={{ fontSize: 15, color: energyColor, fontWeight: 700 }}>
                {energyLabel}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
              background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)",
              color: "#60a5fa"
            }}>
              📋 {taskPct}% tasks
            </div>
            {tipBoost > 0 && (
              <div style={{
                fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
                color: "#34d399"
              }}>
                ⚡ +{tipBoost}% tips
              </div>
            )}
            {pendingBoost > 0 && (
              <div style={{
                fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
                color: "#fbbf24", animation: sessionOn ? "pulse 1.5s ease infinite" : "none"
              }}>
                🕐 +{pendingBoost}% pending
              </div>
            )}
          </div>
        </div>

        {/* Main energy bar */}
        <div style={{
          width: "100%", height: 10, background: "rgba(255,255,255,0.06)",
          borderRadius: 99, overflow: "hidden", marginBottom: 8
        }}>
          <div style={{
            height: "100%", display: "flex", borderRadius: 99, overflow: "hidden",
            width: `${energyPct}%`, transition: "width 0.8s ease"
          }}>
            <div style={{
              width: `${taskPct > 0 && energyPct > 0 ? (taskPct / energyPct) * 100 : 0}%`,
              background: "#3b82f6", transition: "width 0.8s ease"
            }} />
            <div style={{ flex: 1, background: "#10b981" }} />
          </div>
        </div>

        {/* Pending boost preview bar */}
        {pendingBoost > 0 && (
          <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: `${Math.min(100, energyPct + pendingBoost)}%`,
              background: "rgba(245,158,11,0.35)",
              transition: "width 0.5s ease"
            }} />
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>

        {pendingBoost > 0 && (
          <p style={{ fontSize: 11, color: "rgba(245,158,11,0.6)", margin: "8px 0 0" }}>
            ✦ Complete your session to earn +{pendingBoost}% more energy (total will be {Math.min(100, energyPct + pendingBoost)}%)
          </p>
        )}
      </div>

      {/* ── Active session — circular focus timer ── */}
      {sessionOn && activeTip && (
        <div style={{
          background: "linear-gradient(180deg,rgba(124,58,237,0.1),rgba(15,10,25,0.4))",
          border: "1px solid rgba(124,58,237,0.3)",
          borderRadius: 20, padding: "28px 24px 24px",
          marginBottom: 16, display: "flex", flexDirection: "column", alignItems: "center"
        }}>
          <p style={{
            fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 20px",
            display: "flex", alignItems: "center", gap: 6
          }}>
            <span style={{ fontSize: 14 }}>🌙</span> Low energy session in progress
          </p>

          {/* Ring */}
          <div style={{ position: "relative", width: RING_SIZE, height: RING_SIZE, marginBottom: 22 }}>
            <svg
              width={RING_SIZE} height={RING_SIZE}
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
              style={{ transform: "rotate(-90deg)", animation: !paused ? "ringGlow 2.4s ease-in-out infinite" : "none" }}
            >
              <circle
                cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
                fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={RING_STROKE}
              />
              <circle
                cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
                fill="none" stroke="url(#ringGradient)" strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={RING_CIRC}
                strokeDashoffset={ringOffset}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
              <defs>
                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center content */}
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 6
            }}>
              <span style={{
                fontSize: 44, fontWeight: 800, color: "#c4b5fd",
                fontVariantNumeric: "tabular-nums", letterSpacing: 1,
                animation: !paused ? "pulse 2s ease infinite" : "none"
              }}>
                {fmt(secsLeft)}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <span>{activeTip.icon}</span> {activeTip.tip}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 99, padding: "3px 12px", marginTop: 2
              }}>
                Step {curStep + 1} of {queued.length}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
            <button
              onClick={resetStep}
              title="Restart this step"
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer"
              }}
            >
              <FaRedo size={14} />
            </button>

            <button
              onClick={() => setPaused(p => !p)}
              title={paused ? "Resume" : "Pause"}
              style={{
                width: 68, height: 68, borderRadius: "50%",
                background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
                border: "none", boxShadow: "0 0 22px rgba(124,58,237,0.55)",
                color: "white", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", fontSize: 20
              }}
            >
              {paused ? <FaPlay style={{ marginLeft: 3 }} /> : <FaPause />}
            </button>

            <button
              onClick={skipStep}
              title="Skip to next"
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer"
              }}
            >
              <FaForward size={14} />
            </button>
          </div>

          <button
            onClick={stopSession}
            style={{
              fontSize: 12, fontWeight: 600, color: "rgba(248,113,113,0.8)",
              background: "transparent", border: "none", cursor: "pointer",
              marginBottom: 20, textDecoration: "underline", textUnderlineOffset: 3
            }}
          >
            End session
          </button>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, width: "100%" }}>
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, padding: "14px 8px", textAlign: "center"
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>⚡</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{earned.length}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Boosts</div>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, padding: "14px 8px", textAlign: "center"
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>⏱️</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{minsFocused}m</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Focused</div>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, padding: "14px 8px", textAlign: "center"
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>🌱</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{queued.length - curStep - 1}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Left</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Two column layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Tips panel */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "18px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Energy boosters</h3>
            <span style={{
              marginLeft: "auto", fontSize: 11, fontWeight: 700,
              background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)",
              color: "#a78bfa", padding: "2px 8px", borderRadius: 99
            }}>
              {queued.length} queued · {totalQueueMins} min
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {QUICK_TIPS.map((t, i) => {
              const isEarned  = earned.includes(i);
              const isQueued  = queued.includes(i);
              const isActive  = sessionOn && queued[curStep] === i;

              return (
                <div
                  key={i}
                  onClick={() => toggleQueue(i)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", borderRadius: 10,
                    cursor: sessionOn || isEarned ? "default" : "pointer",
                    background: isEarned
                      ? "rgba(16,185,129,0.08)"
                      : isActive
                      ? "rgba(124,58,237,0.12)"
                      : isQueued
                      ? "rgba(245,158,11,0.07)"
                      : "rgba(255,255,255,0.03)",
                    border: isEarned
                      ? "1px solid rgba(16,185,129,0.3)"
                      : isActive
                      ? "1px solid rgba(124,58,237,0.4)"
                      : isQueued
                      ? "1px solid rgba(245,158,11,0.25)"
                      : "1px solid rgba(255,255,255,0.06)",
                    transition: "all 0.2s"
                  }}
                >
                  {/* State indicator */}
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    background: isEarned
                      ? "#10b981"
                      : isActive
                      ? "#7c3aed"
                      : isQueued
                      ? "rgba(245,158,11,0.2)"
                      : "rgba(255,255,255,0.04)",
                    border: isEarned || isActive ? "none" : isQueued
                      ? "1px solid rgba(245,158,11,0.4)"
                      : "1px solid rgba(255,255,255,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s"
                  }}>
                    {isEarned
                      ? <FaCheck size={10} color="white" />
                      : isActive
                      ? <span style={{ fontSize: 8, color: "white", animation: "pulse 1s ease infinite" }}>▶</span>
                      : isQueued
                      ? <span style={{ fontSize: 10, color: "#fbbf24", fontWeight: 800 }}>{queued.indexOf(i) + 1}</span>
                      : null
                    }
                  </div>

                  <span style={{ fontSize: 16, flexShrink: 0 }}>{t.icon}</span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 12, margin: 0, lineHeight: 1.4,
                      color: isEarned ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.8)",
                      textDecoration: isEarned ? "line-through" : "none"
                    }}>
                      {t.tip}
                    </p>
                    <p style={{ fontSize: 10, margin: "2px 0 0", color: "rgba(255,255,255,0.25)" }}>
                      {t.mins} min
                    </p>
                  </div>

                  <div style={{
                    fontSize: 11, fontWeight: 800, padding: "3px 7px", borderRadius: 6,
                    background: isEarned
                      ? "rgba(16,185,129,0.2)"
                      : isQueued
                      ? "rgba(245,158,11,0.15)"
                      : "rgba(255,255,255,0.06)",
                    color: isEarned ? "#34d399" : isQueued ? "#fbbf24" : "rgba(255,255,255,0.3)",
                    border: `1px solid ${isEarned ? "rgba(16,185,129,0.3)" : isQueued ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)"}`,
                    flexShrink: 0, transition: "all 0.2s"
                  }}>
                    +{t.boost}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* Start session button */}
          {!sessionOn && queued.filter(i => !earned.includes(i)).length > 0 && (
            <button
              onClick={startSession}
              style={{
                width: "100%", marginTop: 14, padding: "11px",
                borderRadius: 12,
                background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(99,102,241,0.2))",
                border: "1px solid rgba(124,58,237,0.45)",
                color: "#c4b5fd", fontSize: 14, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8
              }}
            >
              <FaPlay size={11} />
              Start {totalQueueMins} min session · earn +{pendingBoost}%
            </button>
          )}

          {!sessionOn && queued.length === 0 && (
            <p style={{
              fontSize: 12, color: "rgba(255,255,255,0.25)",
              textAlign: "center", marginTop: 12
            }}>
              Tap tips above to queue them
            </p>
          )}
        </div>

        {/* Gentle tasks */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "18px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 16 }}>🌱</span>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Gentle tasks</h3>
            <span style={{
              marginLeft: "auto", fontSize: 11, fontWeight: 700,
              background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)",
              color: "#818cf8", padding: "2px 8px", borderRadius: 99
            }}>
              click to add
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MOOD_TASKS.map((task, i) => (
              <div
                key={i}
                onClick={() => addMoodTask(task)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10,
                  cursor: addedMoods.includes(task.text) ? "default" : "pointer",
                  background: addedMoods.includes(task.text)
                    ? "rgba(99,102,241,0.08)"
                    : "rgba(255,255,255,0.03)",
                  border: addedMoods.includes(task.text)
                    ? "1px solid rgba(99,102,241,0.25)"
                    : "1px solid rgba(255,255,255,0.06)",
                  transition: "all 0.18s",
                  opacity: addedMoods.includes(task.text) ? 0.6 : 1
                }}
                onMouseEnter={e => {
                  if (!addedMoods.includes(task.text))
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
                }}
                onMouseLeave={e => {
                  if (!addedMoods.includes(task.text))
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{task.icon}</span>
                <p style={{ fontSize: 13, margin: 0, flex: 1, color: "rgba(255,255,255,0.8)" }}>
                  {task.text}
                </p>
                <div style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                  background: addedMoods.includes(task.text)
                    ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)",
                  color: addedMoods.includes(task.text)
                    ? "#818cf8" : "rgba(255,255,255,0.35)",
                  border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0
                }}>
                  {addedMoods.includes(task.text) ? "✓ Added" : "+ Add"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI Suggestions ── */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, padding: "18px 20px"
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 16
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "rgba(124,58,237,0.15)",
              border: "1px solid rgba(124,58,237,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <FaRobot color="#a78bfa" size={14} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>AI gentle suggestions</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                Light tasks tailored for low energy
              </p>
            </div>
          </div>
          <button
            onClick={loadSuggestions} disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.6)", fontSize: 12,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1
            }}
          >
            <FaSyncAlt size={11} style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🤔</div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Finding gentle tasks...</p>
          </div>
        )}
        {!loading && error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10, padding: "14px 16px", textAlign: "center"
          }}>
            <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p>
            <button onClick={loadSuggestions} style={{
              marginTop: 10, padding: "6px 14px", borderRadius: 8,
              border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)",
              color: "#f87171", fontSize: 12, cursor: "pointer"
            }}>Try again</button>
          </div>
        )}
        {!loading && !error && suggestions.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🌿</div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
              {accepted.length > 0
                ? `You've accepted ${accepted.length} suggestion${accepted.length > 1 ? "s" : ""}! Great job.`
                : "No suggestions right now — hit refresh!"}
            </p>
          </div>
        )}
        {!loading && !error && suggestions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {suggestions.map((s, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 14px", borderRadius: 12,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)", gap: 12
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                  <span style={{ fontSize: 16 }}>🌱</span>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0 }}>{s}</p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => handleAccept(s)} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", borderRadius: 8,
                    background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                    color: "#4ade80", fontSize: 12, fontWeight: 600, cursor: "pointer"
                  }}>
                    <FaCheck size={9} /> Add
                  </button>
                  <button onClick={() => handleIgnore(s)} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
                    color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer"
                  }}>
                    <FaTimes size={9} /> Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {accepted.length > 0 && (
          <div style={{
            marginTop: 14, padding: "12px 14px", borderRadius: 10,
            background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)"
          }}>
            <p style={{ fontSize: 13, color: "#4ade80", margin: 0, fontWeight: 600 }}>
              ✅ {accepted.length} task{accepted.length > 1 ? "s" : ""} added to your schedule
            </p>
            {accepted.map((a, i) => (
              <p key={i} style={{
                fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "4px 0 0", paddingLeft: 8
              }}>· {a}</p>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}