import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NotificationBell from "../../pages/NotificationBell";

// ── Mode config ──
const MODES = [
  {
    id:    "Focus Mode",
    icon:  "🎯",
    label: "Focus",
    color: "#7c3aed",
    glow:  "rgba(124,58,237,0.4)",
    bg:    "linear-gradient(135deg,#7c3aed,#6d28d9)",
    desc:  "Deep work. No distractions.",
  },
  {
    id:    "Normal",
    icon:  "⚡",
    label: "Normal",
    color: "#3b82f6",
    glow:  "rgba(59,130,246,0.35)",
    bg:    "linear-gradient(135deg,#3b82f6,#2563eb)",
    desc:  "Balanced productivity.",
  },
  {
    id:    "Low Energy",
    icon:  "🌙",
    label: "Low Energy",
    color: "#10b981",
    glow:  "rgba(16,185,129,0.3)",
    bg:    "linear-gradient(135deg,#10b981,#059669)",
    desc:  "Take it easy today.",
  },
];

// ── Focus Mode Overlay ──
function FocusOverlay({ onClose }) {
  const [seconds,  setSeconds]  = useState(25 * 60);
  const [running,  setRunning]  = useState(false);
  const [session,  setSession]  = useState("work");
  const [rounds,   setRounds]   = useState(0);
  const [breaksCompleted, setBreaksCompleted] = useState(0);
  const intervalRef = useRef(null);

  const PRESETS = [
    { label:"Pomodoro", work:25, break:5  },
    { label:"Long",     work:50, break:10 },
    { label:"Short",    work:15, break:3  },
  ];
  const [preset, setPreset] = useState(0);

  const workSecs  = PRESETS[preset].work  * 60;
  const breakSecs = PRESETS[preset].break * 60;
  const total     = session === "work" ? workSecs : breakSecs;
  const progress  = ((total - seconds) / total) * 100;

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (session === "work") {
              setSession("break");
              setSeconds(breakSecs);
              setRounds(r => r + 1);
            } else {
              setSession("work");
              setSeconds(workSecs);
              setBreaksCompleted(b => b + 1);
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, session]);

  const reset = () => {
    setRunning(false);
    setSession("work");
    setSeconds(PRESETS[preset].work * 60);
  };

  const changePreset = (i) => {
    setPreset(i);
    setRunning(false);
    setSession("work");
    setSeconds(PRESETS[i].work * 60);
  };

  const R   = 80;
  const C   = 2 * Math.PI * R;
  const arc = C - (progress / 100) * C;

  // Total focused time = completed rounds' work seconds + elapsed seconds of
  // the current in-progress work session (0 if currently on a break).
  // Kept in seconds and formatted as MM:SS so it visibly ticks every second,
  // instead of only changing once a full minute has passed.
  const elapsedThisSessionSecs = session === "work" ? (workSecs - seconds) : 0;
  const focusedSecondsTotal    = rounds * workSecs + elapsedThisSessionSecs;
  const focusedMM = String(Math.floor(focusedSecondsTotal / 60)).padStart(2, "0");
  const focusedSS = String(focusedSecondsTotal % 60).padStart(2, "0");

  const tips = [
    "📵 Put your phone face-down",
    "🎧 Use noise-cancelling headphones",
    "💧 Keep water nearby",
    "🚫 Close all social media tabs",
    "✍️ Write your goal before starting",
  ];
  const [tip] = useState(tips[Math.floor(Math.random() * tips.length)]);

  return (
    <div style={FO.overlay} onClick={onClose}>
      <div style={FO.panel} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={FO.header}>
          <div>
            <h2 style={FO.title}>🎯 Focus Mode</h2>
            <p style={FO.subtitle}>Stay locked in. You got this.</p>
          </div>
          <button style={FO.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Preset tabs */}
        <div style={FO.presets}>
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              style={{ ...FO.presetBtn, ...(preset === i ? FO.presetActive : {}) }}
              onClick={() => changePreset(i)}
            >
              {p.label}
              <span style={{ fontSize:11, opacity:0.7, marginLeft:4 }}>
                {p.work}m/{p.break}m
              </span>
            </button>
          ))}
        </div>

        {/* Timer circle */}
        <div style={FO.timerWrap}>
          <svg width={200} height={200} style={{ transform:"rotate(-90deg)" }}>
            <circle cx={100} cy={100} r={R} fill="none"
              stroke="rgba(124,58,237,0.15)" strokeWidth={8}/>
            <circle cx={100} cy={100} r={R} fill="none"
              stroke={session === "work" ? "#a855f7" : "#10b981"}
              strokeWidth={8}
              strokeDasharray={C}
              strokeDashoffset={arc}
              strokeLinecap="round"
              style={{ transition:"stroke-dashoffset 1s linear" }}
            />
          </svg>

          <div style={FO.timerText}>
            <div style={{ ...FO.timerDigits, color: session === "work" ? "#a855f7" : "#10b981" }}>
              {mm}:{ss}
            </div>
            <div style={FO.sessionLabel}>
              {session === "work" ? "🎯 Focus" : "☕ Break"}
            </div>
            <div style={FO.roundsBadge}>Round {rounds + 1}</div>
          </div>
        </div>

        {/* Controls */}
        <div style={FO.controls}>
          <button style={FO.resetBtn} onClick={reset}>↺</button>
          <button
            style={{
              ...FO.playBtn,
              background: running
                ? "linear-gradient(135deg,#ef4444,#dc2626)"
                : "linear-gradient(135deg,#7c3aed,#a855f7)"
            }}
            onClick={() => setRunning(r => !r)}
          >
            {running ? "⏸ Pause" : "▶ Start"}
          </button>
          <button style={FO.resetBtn} onClick={() => {
            setRunning(false);
            if (session === "work") {
              setRounds(r => r + 1);
              setSession("break");
              setSeconds(breakSecs);
            } else {
              setBreaksCompleted(b => b + 1);
              setSession("work");
              setSeconds(workSecs);
            }
          }}>
            ⏭
          </button>
        </div>

        {/* Stats row */}
        <div style={FO.statsRow}>
          {[
            { icon:"🔥", val:rounds,                              lbl:"Rounds"  },
            { icon:"⏱",  val:`${focusedMM}:${focusedSS}`,         lbl:"Focused" },
            { icon:"☕",  val:breaksCompleted,                     lbl:"Breaks"  },
          ].map(s => (
            <div key={s.lbl} style={FO.statBox}>
              <span style={{ fontSize:20 }}>{s.icon}</span>
              <span style={FO.statVal}>{s.val}</span>
              <span style={FO.statLbl}>{s.lbl}</span>
            </div>
          ))}
        </div>

        {/* Focus tip */}
        <div style={FO.tip}>
          <span style={{ fontSize:13 }}>{tip}</span>
        </div>

      </div>
    </div>
  );
}

// ── Main Navbar ──
export default function Navbar({ tasks = [], mode, setMode }) {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showFocus,   setShowFocus]   = useState(false);
  const [showModes,   setShowModes]   = useState(false);
  const modeRef = useRef(null);

  const activeMode = MODES.find(m => m.id === mode) || MODES[1];

  const user = JSON.parse(localStorage.getItem("userProfile")) || {
    name: "Virendra Kumar", email: "virendra@email.com", avatar: null,
  };
  const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  // NOTE: the automatic Low-Energy switching logic used to live here as a
  // duplicate useEffect (based on completed/total, no date filter, no boost).
  // That's been removed — App.jsx is now the single source of truth for
  // auto-switching `mode`, using the correct daily/boost-aware formula.
  // Navbar just displays whatever `mode` it's given and lets the user
  // change it manually via the dropdown below.

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(".nav-avatar-btn")) setShowProfile(false);
      if (modeRef.current && !modeRef.current.contains(e.target)) setShowModes(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const handleMode = (m) => {
    setMode(m.id);
    setShowModes(false);
    if (m.id === "Focus Mode") setShowFocus(true);
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={8000} theme="dark"/>

      {/* Focus Mode Overlay */}
      {showFocus && <FocusOverlay onClose={() => setShowFocus(false)}/>}

      <div className="navbar" style={NAV.bar}>

        {/* ── MODE SWITCHER ── */}
        <div style={{ position:"relative" }} ref={modeRef}>

          <button
            style={{
              ...NAV.modePill,
              background:  activeMode.bg,
              boxShadow: `0 4px 20px ${activeMode.glow}`,
            }}
            onClick={() => setShowModes(v => !v)}
          >
            <span style={{ fontSize:16 }}>{activeMode.icon}</span>
            <span style={NAV.modeLabel}>{activeMode.label}</span>
            <span style={NAV.modeCaret}>▾</span>
          </button>

          {showModes && (
            <div style={NAV.modeDropdown}>
              <p style={NAV.modeDropTitle}>Learning Mode</p>
              {MODES.map(m => (
                <button
                  key={m.id}
                  style={{
                    ...NAV.modeOpt,
                    ...(mode === m.id ? { background:`${m.color}18`, borderColor:`${m.color}40` } : {}),
                  }}
                  onClick={() => handleMode(m)}
                  onMouseEnter={e => e.currentTarget.style.background = `${m.color}12`}
                  onMouseLeave={e => e.currentTarget.style.background = mode === m.id ? `${m.color}18` : "transparent"}
                >
                  <div style={{ ...NAV.modeOptIcon, background:`${m.color}20`, border:`1px solid ${m.color}35` }}>
                    <span style={{ fontSize:18 }}>{m.icon}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>{m.label}</div>
                    <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{m.desc}</div>
                  </div>
                  {mode === m.id && <span style={{ color:m.color, fontSize:14 }}>✓</span>}
                </button>
              ))}

              {mode === "Focus Mode" && (
                <button style={NAV.openTimer} onClick={() => { setShowFocus(true); setShowModes(false); }}>
                  ⏱ Open Focus Timer
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT ACTIONS ── */}
        <div className="nav-actions" style={NAV.actions}>

          <NotificationBell tasks={tasks}/>

          <div
            className="nav-avatar-btn"
            onClick={e => { e.stopPropagation(); setShowProfile(p => !p); }}
            title={user.name}
            style={NAV.avatarBtn}
          >
            {user.avatar
              ? <img src={user.avatar} alt="avatar" className="nav-avatar-img"/>
              : <span style={NAV.initials}>{initials}</span>
            }

            {showProfile && (
              <div className="nav-profile-dropdown" onClick={e => e.stopPropagation()} style={NAV.profileDrop}>
                <div style={NAV.profileTop}>
                  <div style={NAV.profileAvatarLg}>
                    {user.avatar
                      ? <img src={user.avatar} alt="" style={{ width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover" }}/>
                      : <span style={{ fontSize:16, fontWeight:700 }}>{initials}</span>
                    }
                  </div>
                  <div>
                    <p style={{ fontWeight:600, fontSize:14, margin:0 }}>{user.name}</p>
                    <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", margin:0 }}>{user.email}</p>
                  </div>
                </div>
                <div style={NAV.divider}/>
                {[
                  { icon:"👤", label:"View Profile", path:"/profile"  },
                  { icon:"⚙️", label:"Settings",     path:"/settings" },
                ].map(item => (
                  <button
                    key={item.path}
                    className="nav-profile-item"
                    style={NAV.profileItem}
                    onClick={() => navigate(item.path)}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
                <div style={NAV.divider}/>
                <button
                  className="nav-profile-item"
                  style={{ ...NAV.profileItem, color:"#f87171" }}
                  onClick={() => { localStorage.clear(); navigate("/login"); }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Navbar styles ──
const NAV = {
  bar:          { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", height:60, position:"sticky", top:0, zIndex:99, background:"rgba(8,8,16,0.9)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.06)" },
  modePill:     { display:"flex", alignItems:"center", gap:8, padding:"8px 16px", borderRadius:100, border:"none", cursor:"pointer", transition:"all 0.3s", fontFamily:"inherit" },
  modeLabel:    { fontSize:13, fontWeight:700, color:"white" },
  modeCaret:    { fontSize:10, color:"rgba(255,255,255,0.7)", marginLeft:2 },
  modeDropdown: { position:"absolute", top:"calc(100% + 10px)", left:0, width:260, background:"rgba(13,13,26,0.98)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:14, padding:10, zIndex:200, boxShadow:"0 20px 50px rgba(0,0,0,0.6)", backdropFilter:"blur(30px)" },
  modeDropTitle:{ fontSize:10, fontWeight:700, color:"#334155", textTransform:"uppercase", letterSpacing:"0.08em", margin:"4px 8px 10px" },
  modeOpt:      { width:"100%", display:"flex", alignItems:"center", gap:12, padding:"10px 10px", borderRadius:10, border:"1px solid transparent", background:"transparent", cursor:"pointer", transition:"all 0.15s", fontFamily:"inherit", textAlign:"left" },
  modeOptIcon:  { width:40, height:40, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  openTimer:    { width:"100%", marginTop:8, padding:"9px", borderRadius:8, background:"linear-gradient(135deg,rgba(124,58,237,0.2),rgba(99,102,241,0.15))", border:"1px solid rgba(124,58,237,0.3)", color:"#a855f7", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
  actions:      { display:"flex", alignItems:"center", gap:8 },
  avatarBtn:    { width:36, height:36, borderRadius:"50%", border:"2px solid rgba(124,58,237,0.5)", background:"linear-gradient(135deg,#7c3aed,#a855f7)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative", flexShrink:0 },
  initials:     { fontSize:13, fontWeight:700, color:"white" },
  profileDrop:  { position:"absolute", top:"calc(100% + 10px)", right:0, width:220, background:"rgba(13,13,26,0.98)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:14, overflow:"hidden", boxShadow:"0 20px 50px rgba(0,0,0,0.6)", zIndex:200 },
  profileTop:   { display:"flex", alignItems:"center", gap:10, padding:"14px 14px 12px" },
  profileAvatarLg: { width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#a855f7)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  divider:      { height:1, background:"rgba(255,255,255,0.06)" },
  profileItem:  { width:"100%", padding:"10px 14px", background:"transparent", border:"none", color:"#94a3b8", fontSize:13, fontWeight:500, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:8, transition:"background 0.15s", fontFamily:"inherit" },
};

// ── Focus Overlay styles ──
const FO = {
  overlay:      { position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(12px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  panel:        { width:"100%", maxWidth:440, background:"rgba(13,13,26,0.98)", border:"1px solid rgba(124,58,237,0.25)", borderRadius:24, padding:28, display:"flex", flexDirection:"column", gap:20, boxShadow:"0 32px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(124,58,237,0.1)" },
  header:       { display:"flex", justifyContent:"space-between", alignItems:"flex-start" },
  title:        { fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, background:"linear-gradient(135deg,#f1f5f9,#a855f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", marginBottom:4 },
  subtitle:     { fontSize:13, color:"#64748b" },
  closeBtn:     { width:32, height:32, borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:"#64748b", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" },
  presets:      { display:"flex", gap:8 },
  presetBtn:    { flex:1, padding:"8px 6px", borderRadius:8, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", color:"#64748b", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" },
  presetActive: { background:"rgba(124,58,237,0.2)", border:"1px solid rgba(124,58,237,0.4)", color:"#a855f7" },
  timerWrap:    { position:"relative", display:"flex", alignItems:"center", justifyContent:"center", alignSelf:"center" },
  timerText:    { position:"absolute", display:"flex", flexDirection:"column", alignItems:"center", gap:4 },
  timerDigits:  { fontFamily:"'Syne',sans-serif", fontSize:40, fontWeight:800, lineHeight:1 },
  sessionLabel: { fontSize:13, color:"#94a3b8", fontWeight:600 },
  roundsBadge:  { fontSize:11, color:"#475569", padding:"2px 10px", borderRadius:100, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" },
  controls:     { display:"flex", alignItems:"center", gap:12, justifyContent:"center" },
  playBtn:      { padding:"12px 36px", borderRadius:12, border:"none", color:"white", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s", boxShadow:"0 6px 24px rgba(124,58,237,0.4)" },
  resetBtn:     { width:44, height:44, borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:"#94a3b8", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" },
  statsRow:     { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 },
  statBox:      { display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"12px 8px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12 },
  statVal:      { fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:"#f1f5f9" },
  statLbl:      { fontSize:11, color:"#64748b", fontWeight:600 },
  tip:          { padding:"12px 16px", background:"rgba(124,58,237,0.08)", border:"1px solid rgba(124,58,237,0.2)", borderRadius:10, color:"#94a3b8", fontSize:13, textAlign:"center" },
};