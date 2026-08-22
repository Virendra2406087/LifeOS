import { useEffect, useMemo, useState, useCallback } from "react";
import {
  FaVideo, FaClock, FaRobot, FaSyncAlt, FaCheckCircle,
  FaHourglassHalf, FaExternalLinkAlt, FaGoogle, FaMapMarkerAlt, FaMagic,
} from "react-icons/fa";
import { getMeetings } from "../services/meetingService";
import gmailService from "../services/gmailService";
import CreateMeetingForm from "../components/ai/CreateMeetingForm";

const CLOCK_TICK_MS = 30 * 1000;
const DEFAULT_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];
const GMAIL_COLOR = "#ea4335";
const AI_COLOR = "#a855f7"; // purple, distinguishes AI-extracted from calendar-synced

// Combines a date (Date object, ISO string, or "YYYY-MM-DD") with a
// "HH:MM AM/PM" time string into one real Date. Falls back to today
// if no date is given, so calendar/manual meetings without an explicit
// date still work exactly as before.
function parseDateTime(dateInput, timeStr) {
  if (!timeStr) return null;
  const [time, meridiem] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (meridiem?.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (meridiem?.toUpperCase() === "AM" && hours === 12) hours = 0;

  let base;
  if (dateInput) {
    if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [y, m, d] = dateInput.split("-").map(Number);
      base = new Date(y, m - 1, d);
    } else {
      base = new Date(dateInput);
      if (isNaN(base.getTime())) base = new Date();
    }
  } else {
    base = new Date();
  }

  base.setHours(hours, minutes, 0, 0);
  return base;
}

function toTimeLabel(dateInput) {
  const d = new Date(dateInput);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDateLabel(dateInput) {
  if (!dateInput) return null;
  const d =
    typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)
      ? (() => { const [y, m, day] = dateInput.split("-").map(Number); return new Date(y, m - 1, day); })()
      : new Date(dateInput);
  if (isNaN(d.getTime())) return null;

  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  if (isToday) return "Today";
  if (isTomorrow) return "Tomorrow";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Calendar-sourced (structured, high confidence — real events)
function normalizeGmailMeeting(m) {
  return {
    _id: `gmail-${m.id}`,
    title: m.title,
    date: m.start || null,
    time: `${toTimeLabel(m.start)} - ${toTimeLabel(m.end)}`,
    prep: m.location ? `Location: ${m.location}` : "",
    color: GMAIL_COLOR,
    link: m.meetLink || "",
    source: "gmail",
  };
}

// Gemini-extracted from raw email body (already "HH:MM AM/PM" strings)
function normalizeAIMeeting(m) {
  return {
    _id: `ai-${m.id}`,
    title: m.title,
    date: m.date || null,
    time: `${m.startTime} - ${m.endTime}`,
    prep: m.confidence === "medium" ? "AI-detected — verify time" : "",
    color: AI_COLOR,
    link: m.link || "",
    source: "gmail-ai",
  };
}

function getMeetingStatus(meeting, now) {
  const [startStr, endStr] = (meeting.time || "").split(" - ");
  const start = parseDateTime(meeting.date, startStr);
  const end = parseDateTime(meeting.date, endStr);
  if (!start || !end) return { status: "unknown" };
  if (now < start) return { status: "upcoming", minsToStart: Math.round((start - now) / 60000) };
  if (now >= start && now <= end) return { status: "ongoing" };
  return { status: "ended" };
}

export default function SmartMeetingAssistant({ meetings: meetingsProp } = {}) {
  const [meetings, setMeetings] = useState(meetingsProp || []);
  const [gmailMeetings, setGmailMeetings] = useState([]);
  const [aiMeetings, setAiMeetings] = useState([]);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [loading, setLoading] = useState(!meetingsProp);
  const [usingFallback, setUsingFallback] = useState(false);
  const [now, setNow] = useState(new Date());

  const loadMeetings = useCallback(async () => {
    setLoading(true);

    if (meetingsProp) {
      setMeetings(meetingsProp);
    } else {
      try {
        const data = await getMeetings();
        setMeetings(Array.isArray(data) && data.length ? data : []);
        setUsingFallback(false);
      } catch {
        setUsingFallback(true);
        setMeetings([]);
      }
    }

    try {
      const status = await gmailService.getStatus();
      setGmailConnected(status.connected);

      if (status.connected) {
        const [calendarRes, aiRes] = await Promise.all([
          gmailService.getMeetings(),
          gmailService.getAIMeetings(),
        ]);
        setGmailMeetings((calendarRes.meetings || []).map(normalizeGmailMeeting));
        setAiMeetings((aiRes.meetings || []).map(normalizeAIMeeting));
      } else {
        setGmailMeetings([]);
        setAiMeetings([]);
      }
    } catch {
      setGmailMeetings([]);
      setAiMeetings([]);
    }

    setLoading(false);
  }, [meetingsProp]);

  useEffect(() => {
    const handler = () => loadMeetings();
    window.addEventListener("meeting:added", handler);
    return () => window.removeEventListener("meeting:added", handler);
  }, [loadMeetings]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const enrichedMeetings = useMemo(() => {
    const combined = [...meetings, ...gmailMeetings, ...aiMeetings];

    const seen = new Set();
    const deduped = combined.filter((m) => {
      const key = `${(m.title || "").trim().toLowerCase()}-${m.date || ""}-${m.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduped
      .map((m, i) => ({
        ...m,
        color: m.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        dateLabel: formatDateLabel(m.date),
        ...getMeetingStatus(m, now),
      }))
      // Drop anything whose end time has already passed — meetings/interviews
      // that are over just disappear from the list instead of lingering with
      // a "Done" badge. "unknown" status (couldn't parse a time) is kept
      // rather than silently hidden, so parsing issues stay visible/debuggable.
      .filter((m) => m.status !== "ended")
      .sort((a, b) => {
        const aStart = parseDateTime(a.date, (a.time || "").split(" - ")[0]);
        const bStart = parseDateTime(b.date, (b.time || "").split(" - ")[0]);
        return (aStart || 0) - (bStart || 0);
      });
  }, [meetings, gmailMeetings, aiMeetings, now]);

  return (
    <div className="glass-card meeting-card">
      <div className="meeting-header">
        <span className="lifeos-ai-icon">✨</span>
        <h3>Smart Meeting Assistant</h3>
        <button className="meeting-refresh-btn" onClick={loadMeetings} disabled={loading} title="Refresh meetings">
          <FaSyncAlt className={loading ? "spin" : ""} />
        </button>
      </div>

      <CreateMeetingForm onCreated={loadMeetings} />

      {gmailConnected && (
        <small className="gmail-sync-note">
          <FaGoogle /> Calendar + <FaMagic /> AI-scanned inbox synced
        </small>
      )}

      {loading && <p>Loading meetings...</p>}

      {!loading && enrichedMeetings.length === 0 && (
        <p className="meeting-empty">No upcoming meetings.</p>
      )}

      {usingFallback && (
        <small className="ml-fallback-note">Couldn't reach meeting service — showing none</small>
      )}

      {!loading && enrichedMeetings.map((meeting, index) => (
        <div
          className={`meeting-item status-${meeting.status}`}
          key={meeting._id || meeting.title + index}
          style={{ borderLeft: `5px solid ${meeting.color}` }}
        >
          <div className="meeting-title">
            <FaVideo />
            <span>{meeting.title}</span>
            {meeting.source === "gmail" && (
              <span className="status-badge gmail-badge"><FaGoogle /> Calendar</span>
            )}
            {meeting.source === "gmail-ai" && (
              <span className="status-badge ai-badge"><FaMagic /> AI-detected</span>
            )}
            {meeting.status === "ongoing" && (
              <span className="status-badge ongoing"><FaHourglassHalf /> Live now</span>
            )}
            {meeting.status === "upcoming" && meeting.minsToStart <= 30 && (
              <span className="status-badge soon">Starts in {meeting.minsToStart}m</span>
            )}
          </div>

          <p>
            <FaClock /> {meeting.dateLabel ? `${meeting.dateLabel} · ` : ""}{meeting.time}
          </p>

          {meeting.prep && (
            <small>
              {meeting.prep.startsWith("Location:") ? <FaMapMarkerAlt /> : null}{" "}
              {meeting.prep.replace("Location: ", "")}
            </small>
          )}

          {meeting.link && (
            <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="meeting-join-link">
              <FaExternalLinkAlt /> Join Meeting
            </a>
          )}
        </div>
      ))}
    </div>
  );
}