import { useRef, useEffect, useState } from "react";

const ITEM_HEIGHT = 40;

function WheelColumn({ items, value, onChange }) {
  const ref = useRef(null);
  const isScrolling = useRef(false);

  const selectedIndex = items.indexOf(value);

  useEffect(() => {
    if (ref.current && !isScrolling.current) {
      ref.current.scrollTop = selectedIndex * ITEM_HEIGHT;
    }
  }, [value, selectedIndex]);

  const handleScroll = () => {
    if (!ref.current) return;
    isScrolling.current = true;
    clearTimeout(ref.current._scrollTimeout);
    ref.current._scrollTimeout = setTimeout(() => {
      const idx = Math.round(ref.current.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      ref.current.scrollTop = clamped * ITEM_HEIGHT;
      onChange(items[clamped]);
      isScrolling.current = false;
    }, 80);
  };

  return (
    <div style={{ position: "relative", width: 64 }}>
      {/* top fade */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 48,
        background: "linear-gradient(to bottom, rgba(15,10,30,0.95), transparent)",
        zIndex: 2, pointerEvents: "none", borderRadius: "12px 12px 0 0"
      }} />
      {/* bottom fade */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 48,
        background: "linear-gradient(to top, rgba(15,10,30,0.95), transparent)",
        zIndex: 2, pointerEvents: "none", borderRadius: "0 0 12px 12px"
      }} />
      {/* selector highlight */}
      <div style={{
        position: "absolute", top: "50%", left: 4, right: 4,
        transform: "translateY(-50%)",
        height: ITEM_HEIGHT,
        background: "rgba(124,58,237,0.2)",
        border: "1px solid rgba(124,58,237,0.4)",
        borderRadius: 8, zIndex: 1, pointerEvents: "none"
      }} />
      {/* scroll container */}
      <div
        ref={ref}
        onScroll={handleScroll}
        style={{
          height: ITEM_HEIGHT * 5,
          overflowY: "scroll",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollSnapType: "y mandatory",
          paddingTop: ITEM_HEIGHT * 2,
          paddingBottom: ITEM_HEIGHT * 2,
          position: "relative",
        }}
      >
        {items.map((item) => (
          <div
            key={item}
            onClick={() => onChange(item)}
            style={{
              height: ITEM_HEIGHT,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 600,
              color: item === value ? "#c4b5fd" : "rgba(255,255,255,0.3)",
              cursor: "pointer",
              scrollSnapAlign: "center",
              transition: "color 0.15s, font-size 0.15s",
              userSelect: "none",
              ...(item === value ? { fontSize: 20, color: "#e9d5ff" } : {}),
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const PERIODS = ["AM", "PM"];

export default function TimePicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);

  // Parse value (HH:MM 24h) → hour12, minute, period
  const parse = (v) => {
    if (!v) return { h: "12", m: "00", p: "AM" };
    const [hh, mm] = v.split(":");
    const h24 = parseInt(hh, 10);
    const p   = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 || 12;
    return { h: String(h12).padStart(2, "0"), m: mm || "00", p };
  };

  const { h, m, p } = parse(value);

  const emit = (h12, min, period) => {
    let h24 = parseInt(h12, 10) % 12;
    if (period === "PM") h24 += 12;
    onChange(`${String(h24).padStart(2, "0")}:${min}`);
  };

  return (
    <div style={{ position: "relative" }}>
      <label style={{
        display: "block", fontSize: 13,
        color: "rgba(255,255,255,0.5)", marginBottom: 6
      }}>
        {label}
      </label>

      {/* Display button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", padding: "10px 14px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10, color: value ? "#e9d5ff" : "rgba(255,255,255,0.3)",
          fontSize: 15, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          transition: "border 0.2s",
          ...(open ? { borderColor: "rgba(124,58,237,0.6)" } : {}),
        }}
      >
        <span>🕐 {value ? `${h}:${m} ${p}` : "Select time"}</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* Wheel picker dropdown */}
      {open && (
        <div style={{
          position: "absolute", zIndex: 100, top: "calc(100% + 8px)", left: 0, right: 0,
          background: "rgba(15,10,30,0.97)",
          border: "1px solid rgba(124,58,237,0.3)",
          borderRadius: 16, padding: "12px 8px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}>
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 4,
          }}>
            <WheelColumn
              items={HOURS}
              value={h}
              onChange={v => emit(v, m, p)}
            />
            <span style={{
              fontSize: 24, fontWeight: 800,
              color: "rgba(255,255,255,0.4)", paddingBottom: 4
            }}>:</span>
            <WheelColumn
              items={MINUTES}
              value={m}
              onChange={v => emit(h, v, p)}
            />
            <WheelColumn
              items={PERIODS}
              value={p}
              onChange={v => emit(h, m, v)}
            />
          </div>

          {/* Done button */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              marginTop: 12, width: "100%",
              padding: "9px 0",
              background: "rgba(124,58,237,0.25)",
              border: "1px solid rgba(124,58,237,0.4)",
              borderRadius: 10, color: "#c4b5fd",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              letterSpacing: 0.5,
            }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}