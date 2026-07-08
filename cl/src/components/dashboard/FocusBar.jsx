import { useState, useEffect } from "react";

export default function FocusBar({ minutes, exitFocus }) {

  const [seconds, setSeconds] = useState(minutes * 60);

  useEffect(() => {

    const timer = setInterval(() => {

      setSeconds(prev => {

        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;

      });

    }, 1000);

    return () => clearInterval(timer);

  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (

    <div className="focus-bar">

      {/* 🔥 Focus Mode Active */}

      <span className="focus-timer">
        {String(mins).padStart(2,"0")}:
        {String(secs).padStart(2,"0")}
      </span>

      <button
        className="exit-focus"
        onClick={exitFocus}
      >
        Exit Focus Mode
      </button>

    </div>

  );

}