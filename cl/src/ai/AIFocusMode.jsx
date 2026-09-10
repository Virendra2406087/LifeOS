import { Coffee, Headphones, Zap,SmartphoneOff  } from "lucide-react";
import { useState, useEffect } from "react";
import {
  FaBrain,
  FaPlay,
  FaPause,
  FaRedo,
  FaFire,
} from "react-icons/fa";

export default function AIFocusMode() {
  const FOCUS_TIME = 25 * 60;

  const [seconds, setSeconds] = useState(FOCUS_TIME);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let timer;

    if (running && seconds > 0) {
      timer = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    }

    if (seconds === 0) {
      setRunning(false);
      alert("🎉 Focus Session Completed!");
    }

    return () => clearInterval(timer);
  }, [running, seconds]);

  const formatTime = () => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="glass-card focus-card">

      <div className="focus-header">
        <FaBrain className="focus-icon" />
        <h3>AI Focus Mode</h3>
      </div>

      <div className="focus-score">
        <FaFire />
        <span>Best Focus Time: 9:00 AM – 11:00 AM</span>
      </div>

      <div className="focus-timer-display">
        {formatTime()}
      </div>

      <div className="focus-buttons">

        <button onClick={() => setRunning(true)}>
          <FaPlay />
          Start
        </button>

        <button onClick={() => setRunning(false)}>
          <FaPause />
          Pause
        </button>

        <button
          onClick={() => {
            setSeconds(FOCUS_TIME);
            setRunning(false);
          }}
        >
          <FaRedo />
          Reset
        </button>

      </div>

      <div className="focus-tips">

        <h4>AI Recommendations</h4>

        <ul>
          <li><SmartphoneOff /> Keep phone away during session.</li>
          <li><Headphones/> Listen to instrumental music.</li>
          <li><Coffee/> Take a 5‑minute break after 25 minutes.</li>
          <li><Zap/> Your productivity is highest before lunch.</li>
        </ul>

      </div>

    </div>
  );
}