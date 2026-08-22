import { useRef, useState } from "react";
import { FaMicrophone, FaStop, FaRobot } from "react-icons/fa";
import API from "../../app/api";

const SpeechRecognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

// Pulls a time like "7 PM" / "7:30 pm" out of the transcript, if present.
const extractTime = (transcript) => {
  const match = transcript.match(/(\d{1,2})(:(\d{2}))?\s*(am|pm)/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = match[3] ? parseInt(match[3], 10) : 0;
  const period = match[4].toLowerCase();

  if (period === "pm" && hour !== 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;

  return { hour, minute, raw: match[0] };
};

// Simple keyword-based priority detection from spoken phrasing.
const extractPriority = (transcript) => {
  const text = transcript.toLowerCase();
  if (text.includes("urgent") || text.includes("asap") || text.includes("important")) return "High";
  if (text.includes("later") || text.includes("whenever") || text.includes("low priority")) return "Low";
  return "Medium";
};

// Strips the time phrase and filler words ("remind me to", "at") to leave
// a clean task name, e.g. "remind me to call rahul at 7 pm" -> "call rahul"
const extractCleanText = (transcript, timeMatch) => {
  let cleaned = transcript;

  if (timeMatch) {
    cleaned = cleaned.replace(timeMatch.raw, "");
  }

  cleaned = cleaned
    .replace(/remind me to/gi, "")
    .replace(/\bat\b\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || transcript.trim();
};

const toTimeString = (hour, minute) =>
  `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

export default function AIVoiceAssistant({ setTasks }) {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const recognitionRef = useRef(null);

  const startListening = () => {
    if (!SpeechRecognition) {
      alert("Speech Recognition isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    setListening(true);
    setStatus("Listening...");

    recognition.start();

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
      setStatus("Processing...");

      const timeMatch = extractTime(transcript);
      const priority = extractPriority(transcript);
      const cleanText = extractCleanText(transcript, timeMatch);

      const today = new Date().toISOString().split("T")[0];

      let startTime, endTime;

      if (timeMatch) {
        startTime = toTimeString(timeMatch.hour, timeMatch.minute);
        const endHour = timeMatch.minute >= 30 ? timeMatch.hour + 1 : timeMatch.hour;
        const endMinute = timeMatch.minute >= 30 ? timeMatch.minute - 30 : timeMatch.minute + 30;
        endTime = toTimeString(endHour, endMinute);
      } else {
        // No time spoken — default to 30 minutes from now
        const now = new Date();
        startTime = toTimeString(now.getHours(), now.getMinutes());
        const later = new Date(now.getTime() + 30 * 60000);
        endTime = toTimeString(later.getHours(), later.getMinutes());
      }

      const task = {
        text: cleanText,
        date: today,
        startTime,
        endTime,
        priority,
        completed: false,
      };

      try {
        const res = await API.post("/tasks", task);
        setTasks((prev) => [...prev, res.data]);
        setStatus(`Added: "${cleanText}"${timeMatch ? ` at ${timeMatch.raw}` : ""}`);
      } catch (err) {
        console.error(err.response?.data || err.message);
        setStatus("Couldn't save task — check your connection and try again.");
      }
    };

    recognition.onerror = (event) => {
      setListening(false);

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setStatus("Microphone access denied. Allow mic permission and try again.");
      } else if (event.error === "no-speech") {
        setStatus("Didn't catch that — try again.");
      } else {
        setStatus(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  return (
    <div className="glass-card voice-card">
      <div className="voice-header">
        {/* <FaRobot /> */}
        <span className="lifeos-ai-icon">
      ✨
    </span>
        <h3>AI Voice Assistant</h3>
      </div>

      <div className="voice-output">
        {text || "Say something like: Remind me to call Rahul at 7 PM"}
      </div>

      {status && <p className="voice-status">{status}</p>}

      <button
        className="voice-btn"
        onClick={listening ? stopListening : startListening}
      >
        {listening ? <FaStop /> : <FaMicrophone />}
        {listening ? " Stop" : " Start Voice"}
      </button>
    </div>
  );
}