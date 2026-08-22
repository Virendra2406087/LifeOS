import { useEffect, useRef, useState } from "react";
import { FaWhatsapp, FaBell, FaTrash, FaTimes, FaClock } from "react-icons/fa";
import {
  fetchReminders,
  createReminder,
  deleteReminder,
} from "../../services/reminderService";
import "./CallWhatsAppReminder.css";

// How often the live countdown text re-renders. Display-only — nothing
// here deletes a reminder based on elapsed time. Removal only happens
// when the user clicks "OK" on the ReminderAlarm popup, or the trash icon.
const TICK_MS = 1000;

const buildDateFromTime = (hhmm) => {
  const [hour, minute] = hhmm.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

function formatDisplayFromISO(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return isoString;
  }
}

function formatCountdown(isoString, now) {
  const diffMs = new Date(isoString).getTime() - now;
  if (diffMs <= 0) return "Due now";

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m ${seconds}s left`;
  return `${seconds}s left`;
}

// --- iOS-style wheel picker column -----------------------------------

const ITEM_H = 44;
const VISIBLE_ROWS = 5;
const WHEEL_H = ITEM_H * VISIBLE_ROWS;
const PAD = (WHEEL_H - ITEM_H) / 2;

function WheelColumn({ items, index, onChange, ariaLabel }) {
  const scrollRef = useRef(null);
  const rafRef = useRef(null);
  const settleRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(index * ITEM_H);

  // Position the wheel on mount / whenever the index is set externally
  // (e.g. opening the modal with a fresh default time).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = index * ITEM_H;
    setScrollTop(index * ITEM_H);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (settleRef.current) clearTimeout(settleRef.current);
    },
    []
  );

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setScrollTop(el.scrollTop));

    if (settleRef.current) clearTimeout(settleRef.current);
    settleRef.current = setTimeout(() => {
      const nearest = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, nearest));
      el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
      if (clamped !== index) onChange(clamped);
    }, 110);
  };

  const selectIndex = (i) => {
    scrollRef.current?.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
    onChange(i);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      selectIndex(Math.max(0, index - 1));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      selectIndex(Math.min(items.length - 1, index + 1));
    }
  };

  const centerContinuous = scrollTop / ITEM_H;

  return (
    <div className="wheel-col" style={{ height: WHEEL_H }}>
      <div
        className="wheel-scroll"
        ref={scrollRef}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        style={{ paddingTop: PAD, paddingBottom: PAD }}
        tabIndex={0}
        role="listbox"
        aria-label={ariaLabel}
      >
        {items.map((item, i) => {
          const dist = Math.abs(i - centerContinuous);
          const opacity = Math.max(0.16, 1 - dist * 0.4);
          const scale = Math.max(0.7, 1 - dist * 0.15);
          return (
            <div
              key={item.value}
              className="wheel-item"
              role="option"
              aria-selected={i === index}
              style={{ height: ITEM_H, opacity, transform: `scale(${scale})` }}
              onClick={() => selectIndex(i)}
            >
              {item.label}
            </div>
          );
        })}
      </div>
      <div className="wheel-fade wheel-fade-top" style={{ height: PAD }} />
      <div className="wheel-fade wheel-fade-bottom" style={{ height: PAD }} />
    </div>
  );
}

const HOURS = Array.from({ length: 12 }, (_, i) => ({
  label: String(i + 1).padStart(2, "0"),
  value: i + 1,
}));
const MINUTES = Array.from({ length: 60 }, (_, i) => ({
  label: String(i).padStart(2, "0"),
  value: i,
}));
const PERIODS = [
  { label: "AM", value: "AM" },
  { label: "PM", value: "PM" },
];

// Rounds "now" up to the next 5-minute mark, as a friendly default.
function getDefaultWheelIndices() {
  const now = new Date();
  let minutes = Math.ceil(now.getMinutes() / 5) * 5;
  let hours = now.getHours();
  if (minutes === 60) {
    minutes = 0;
    hours += 1;
  }
  const period = hours >= 12 ? "PM" : "AM";
  let hour12 = hours % 12;
  if (hour12 === 0) hour12 = 12;

  return { hourIndex: hour12 - 1, minuteIndex: minutes, periodIndex: period === "AM" ? 0 : 1 };
}

function toHHmm(hourIndex, minuteIndex, periodIndex) {
  let hour24 = HOURS[hourIndex].value % 12;
  if (PERIODS[periodIndex].value === "PM") hour24 += 12;
  return `${String(hour24).padStart(2, "0")}:${String(MINUTES[minuteIndex].value).padStart(2, "0")}`;
}

// --- main component -----------------------------------------------------

const EMPTY_FORM = { name: "", phone: "", message: "" };

export default function CallWhatsAppReminder() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [now, setNow] = useState(Date.now());

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [wheel, setWheel] = useState(getDefaultWheelIndices());
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const result = await fetchReminders();
    setItems(result.success ? result.data : []);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const id = e.detail?.id;
      if (!id) return;
      setItems((prev) => prev.filter((it) => it._id !== id));
    };
    window.addEventListener("reminder:removed", handler);
    return () => window.removeEventListener("reminder:removed", handler);
  }, []);

  const openModal = () => {
    setForm(EMPTY_FORM);
    setWheel(getDefaultWheelIndices());
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim() || !form.phone.trim()) {
      setFormError("Name and phone are required.");
      return;
    }
    if (!form.message.trim()) {
      setFormError("Message is required.");
      return;
    }

    const hhmm = toHHmm(wheel.hourIndex, wheel.minuteIndex, wheel.periodIndex);
    const time = buildDateFromTime(hhmm);

    if (new Date(time).getTime() <= Date.now()) {
      setFormError("Reminder time must be in the future.");
      return;
    }

    setSubmitting(true);
    const result = await createReminder({
      name: form.name.trim(),
      phone: form.phone.trim(),
      time,
      message: form.message.trim(),
    });
    setSubmitting(false);

    if (!result.success) {
      setFormError(result.message || "Failed to add reminder");
      return;
    }

    setItems((prev) => [result.data, ...prev]);
    setModalOpen(false);
    window.dispatchEvent(new CustomEvent("reminder:added"));
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete reminder for ${item.name}?`)) return;

    setActingId(item._id);
    const result = await deleteReminder(item._id);
    setActingId(null);

    if (!result.success) {
      alert(result.message || "Failed to delete reminder");
      return;
    }

    setItems((prev) => prev.filter((it) => it._id !== item._id));
    window.dispatchEvent(new CustomEvent("reminder:removed", { detail: { id: item._id } }));
  };

  const previewTime = `${HOURS[wheel.hourIndex].label}:${MINUTES[wheel.minuteIndex].label} ${PERIODS[wheel.periodIndex].label}`;

  return (
    <div className="glass-card reminder-card cwar-root">
      <div className="cwar-header">
        <FaBell />
        <h3>WhatsApp Reminders</h3>
      </div>

      <button className="cwar-trigger" onClick={openModal}>
        <FaWhatsapp /> Add Reminder
      </button>

      {loading ? (
        <p className="cwar-status">Loading reminders...</p>
      ) : items.length === 0 ? (
        <p className="cwar-status">No reminders added.</p>
      ) : (
        <div className="cwar-list">
          {items.map((item) => (
            <div className="cwar-item" key={item._id}>
              <div className="cwar-item-icon">
                <FaWhatsapp />
              </div>
              <div className="cwar-item-info">
                <h4>{item.name}</h4>
                <small>
                  {formatDisplayFromISO(item.time)} · {item.status || "pending"}
                </small>
                <small className="cwar-countdown">
                  <FaClock /> {formatCountdown(item.time, now)}
                </small>
              </div>
              <button
                className="cwar-delete"
                disabled={actingId === item._id}
                onClick={() => handleDelete(item)}
                title="Delete"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="cwar-overlay" onClick={closeModal}>
          <div className="cwar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cwar-modal-header">
              <div className="cwar-badge">
                <FaWhatsapp />
              </div>
              <div>
                <span className="cwar-eyebrow">WhatsApp</span>
                <h3>Add Reminder</h3>
              </div>
              <button type="button" className="cwar-close" onClick={closeModal} aria-label="Close">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="cwar-form">
              <div className="cwar-field">
                <label htmlFor="cwar-name">Contact name</label>
                <input
                  id="cwar-name"
                  type="text"
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Who's this for?"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="cwar-field">
                <label htmlFor="cwar-phone">Phone number</label>
                <input
                  id="cwar-phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  placeholder="+91XXXXXXXXXX"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="cwar-field">
                <label>Reminder time</label>
                <div className="wheel-picker">
                  <WheelColumn
                    items={HOURS}
                    index={wheel.hourIndex}
                    ariaLabel="Hour"
                    onChange={(i) => setWheel((w) => ({ ...w, hourIndex: i }))}
                  />
                  <span className="wheel-colon">:</span>
                  <WheelColumn
                    items={MINUTES}
                    index={wheel.minuteIndex}
                    ariaLabel="Minute"
                    onChange={(i) => setWheel((w) => ({ ...w, minuteIndex: i }))}
                  />
                  <WheelColumn
                    items={PERIODS}
                    index={wheel.periodIndex}
                    ariaLabel="AM or PM"
                    onChange={(i) => setWheel((w) => ({ ...w, periodIndex: i }))}
                  />
                  <div className="wheel-highlight-band" />
                </div>
                <p className="wheel-preview">{previewTime}</p>
              </div>

              <div className="cwar-field">
                <label htmlFor="cwar-message">Message</label>
                <textarea
                  id="cwar-message"
                  value={form.message}
                  onChange={handleChange("message")}
                  placeholder="This is a reminder message..."
                  rows={3}
                  maxLength={200}
                  disabled={submitting}
                  required
                />
                <span className="cwar-counter">{form.message.length}/200</span>
              </div>

              {formError && <p className="cwar-error">{formError}</p>}

              <div className="cwar-actions">
                <button type="button" className="cwar-cancel" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="cwar-submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Add reminder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}