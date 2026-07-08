import { useState, useEffect, useCallback } from "react";
import { FaRobot, FaCheck, FaTimes, FaSyncAlt } from "react-icons/fa";
import { fetchAISuggestions } from "../../services/aiService";

export default function AISuggestions({ tasks = [], setTasks }) {

  const [suggestions, setSuggestions] = useState([]);
  const [ignored, setIgnored]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  /* ================= GET NEXT TIME SLOT ================= */

  function getNextTimeSlot() {

    let startTime;

    if (tasks.length === 0) {
      startTime = new Date();
    } else {
      const lastTask = tasks[tasks.length - 1];

      if (!lastTask.time) {
        startTime = new Date();
      } else {
        const endPart = lastTask.time.split(" - ")[1];
        const [time, period] = endPart.split(" ");
        let [hours, minutes] = time.split(":").map(Number);

        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        startTime = new Date();
        startTime.setHours(hours, minutes, 0);
      }
    }

    const endTime = new Date(startTime.getTime() + 20 * 60000);

    const fmt = (date) => {
      let h = date.getHours();
      const m = date.getMinutes().toString().padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h}:${m} ${ampm}`;
    };

    return `${fmt(startTime)} - ${fmt(endTime)}`;
  }

  /* ================= FETCH FROM GEMINI ================= */

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetchAISuggestions(tasks);
      const fresh = (res.data.suggestions || []).filter(
        (s) => !ignored.includes(s)
      );
      setSuggestions(fresh);
    } catch (err) {
      console.error(err);
      setError("Could not load suggestions. Try again.");
    } finally {
      setLoading(false);
    }
  }, [tasks, ignored]);

  // Only load ONCE on mount — user clicks refresh to reload
  // This prevents hammering the API quota on every task change
  useEffect(() => {
    loadSuggestions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ================= ACCEPT ================= */

  function handleAccept(suggestion) {
    const newTask = {
      id: Date.now(),
      text: suggestion,
      time: getNextTimeSlot(),
      priority: "orange",
      completed: false,
    };
    setTasks((prev) => [...prev, newTask]);
    setIgnored((prev) => [...prev, suggestion]);
    setSuggestions((prev) => prev.filter((s) => s !== suggestion));
  }

  /* ================= IGNORE ================= */

  function handleIgnore(suggestion) {
    setIgnored((prev) => [...prev, suggestion]);
    setSuggestions((prev) => prev.filter((s) => s !== suggestion));
  }

  /* ================= UI ================= */

  return (
    <div className="ai-card">

      <div className="ai-header">
        <FaRobot className="ai-icon" />
        <h3>AI Suggestions</h3>
        <button
          className="ai-refresh"
          onClick={loadSuggestions}
          disabled={loading}
          title="Refresh suggestions"
        >
          <FaSyncAlt className={loading ? "spin" : ""} />
        </button>
      </div>

      {loading && (
        <p className="ai-empty">Thinking...</p>
      )}

      {!loading && error && (
        <p className="ai-empty">{error}</p>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <p className="ai-empty">No suggestions right now</p>
      )}

      {!loading && !error && suggestions.map((s, index) => (
        <div key={index} className="ai-suggestion">

          <p>{s}</p>

          <div className="ai-buttons">
            <button className="ai-accept" onClick={() => handleAccept(s)}>
              <FaCheck /> Accept
            </button>
            <button className="ai-ignore" onClick={() => handleIgnore(s)}>
              <FaTimes /> Ignore
            </button>
          </div>

        </div>
      ))}

    </div>
  );
}