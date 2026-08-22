import { useState } from "react";
import { FaPlus, FaVideo, FaTimes, FaLink } from "react-icons/fa";
import { createMeeting } from "../../services/meetingService";

const COLOR_OPTIONS = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Green", value: "#10b981" },
  { label: "Orange", value: "#f59e0b" },
  { label: "Red", value: "#ef4444" },
];

const EMPTY_FORM = {
  title: "",
  startTime: "",
  endTime: "",
  prep: "",
  follow: "",
  color: COLOR_OPTIONS[0].value,
  link: "",
};

function isValidUrl(value) {
  if (!value.trim()) return true; // link is optional
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function CreateMeetingForm({ onCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetAndClose = () => {
    setForm(EMPTY_FORM);
    setError("");
    setIsOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim() || !form.startTime || !form.endTime) {
      setError("Title, start time, and end time are required.");
      return;
    }

    if (!isValidUrl(form.link)) {
      setError("Meeting link must be a valid URL (e.g. https://zoom.us/j/...).");
      return;
    }

    setSubmitting(true);
    try {
      const meeting = await createMeeting(form);
      onCreated?.(meeting);
      resetAndClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create meeting. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button className="meeting-add-btn" onClick={() => setIsOpen(true)}>
        <FaPlus /> Add Meeting
      </button>
    );
  }

  return (
    <div className="meeting-form-overlay" onClick={resetAndClose}>
      <div className="meeting-form-card glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="meeting-form-header">
          <div className="meeting-form-title">
            <FaVideo /> New Meeting
          </div>
          <button type="button" className="meeting-form-close" onClick={resetAndClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="meeting-form-body">
          <label>
            Title
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Sprint Planning"
              required
            />
          </label>

          <div className="meeting-form-row">
            <label>
              Start time
              <input
                type="time"
                name="startTimeRaw"
                onChange={(e) => {
                  const formatted = to12Hour(e.target.value);
                  setForm((prev) => ({ ...prev, startTime: formatted }));
                }}
                required
              />
            </label>

            <label>
              End time
              <input
                type="time"
                name="endTimeRaw"
                onChange={(e) => {
                  const formatted = to12Hour(e.target.value);
                  setForm((prev) => ({ ...prev, endTime: formatted }));
                }}
                required
              />
            </label>
          </div>

          <label>
            <FaLink style={{ marginRight: 6 }} />
            Meeting link (optional)
            <input
              type="url"
              name="link"
              value={form.link}
              onChange={handleChange}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
            />
          </label>

          <label>
            Preparation note
            <input
              type="text"
              name="prep"
              value={form.prep}
              onChange={handleChange}
              placeholder="e.g. Review requirements"
            />
          </label>

          <label>
            Follow-up note
            <input
              type="text"
              name="follow"
              value={form.follow}
              onChange={handleChange}
              placeholder="e.g. Send summary after"
            />
          </label>

          <div className="meeting-form-colors">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`meeting-color-dot ${form.color === c.value ? "selected" : ""}`}
                style={{ background: c.value }}
                onClick={() => setForm((prev) => ({ ...prev, color: c.value }))}
                title={c.label}
                aria-label={c.label}
              />
            ))}
          </div>

          {error && <p className="meeting-form-error">{error}</p>}

          <div className="meeting-form-actions">
            <button type="button" onClick={resetAndClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? "Creating..." : "Create Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function to12Hour(timeStr) {
  if (!timeStr) return "";
  let [hours, minutes] = timeStr.split(":").map(Number);
  const meridiem = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${meridiem}`;
}