import { useState, useEffect } from "react";

export default function PomodoroTimer() {

  const FOCUS_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;

  const [seconds, setSeconds] = useState(FOCUS_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("focus");

  useEffect(() => {

    let timer;

    if (isRunning) {
      timer = setInterval(() => {
        setSeconds(prev => {

          if (prev === 0) {

            if (mode === "focus") {
              setMode("break");
              return BREAK_TIME;
            } else {
              setMode("focus");
              return FOCUS_TIME;
            }

          }

          return prev - 1;

        });
      }, 1000);
    }

    return () => clearInterval(timer);

  }, [isRunning, mode]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="glass-card pomodoro">

      <h3>⏱ Focus Timer</h3>

      <p className="mode">
        {mode === "focus" ? "Focus Time 🔥" : "Break Time ☕"}
      </p>

      <div className="timer">
        {String(minutes).padStart(2,"0")}:
        {String(secs).padStart(2,"0")}
      </div>

      <div className="timer-buttons">

        <button onClick={()=>setIsRunning(true)}>
          Start
        </button>

        <button onClick={()=>setIsRunning(false)}>
          Pause
        </button>

        <button onClick={()=>{
          setIsRunning(false)
          setMode("focus")
          setSeconds(FOCUS_TIME)
        }}>
          Reset
        </button>

      </div>

    </div>
  );
}