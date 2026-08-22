import {
  FaRobot,
  FaClock,
  FaLaptop,
  FaCoffee,
  FaRunning,
  FaCheckCircle,
  FaBook,
  FaPhone,
  FaUsers,
  FaUtensils,
  FaBed,
  FaShoppingCart,
  FaHeartbeat,
  FaMoneyBillWave,
  FaPlane,
  FaTasks,
} from "react-icons/fa";

// Ordered keyword rules — first match wins. Add more as your task
// vocabulary grows; falls back to a generic task icon if nothing matches.
const ICON_RULES = [
  { keywords: ["meeting", "call", "standup", "sync"], icon: FaUsers, color: "#3b82f6" },
  { keywords: ["phone", "ring", "dial"], icon: FaPhone, color: "#06b6d4" },
  { keywords: ["gym", "workout", "run", "exercise", "yoga"], icon: FaRunning, color: "#ef4444" },
  { keywords: ["lunch", "breakfast", "dinner", "eat", "meal"], icon: FaUtensils, color: "#f97316" },
  { keywords: ["coffee", "break", "rest", "relax"], icon: FaCoffee, color: "#f59e0b" },
  { keywords: ["sleep", "nap", "bed"], icon: FaBed, color: "#8b5cf6" },
  { keywords: ["study", "learn", "read", "course", "class"], icon: FaBook, color: "#22c55e" },
  { keywords: ["project", "code", "develop", "build", "assignment", "report"], icon: FaLaptop, color: "#6366f1" },
  { keywords: ["review", "plan", "check", "todo"], icon: FaCheckCircle, color: "#8b5cf6" },
  { keywords: ["shopping", "buy", "purchase", "order"], icon: FaShoppingCart, color: "#ec4899" },
  { keywords: ["health", "doctor", "medicine", "appointment"], icon: FaHeartbeat, color: "#f43f5e" },
  { keywords: ["pay", "bill", "budget", "finance", "money"], icon: FaMoneyBillWave, color: "#10b981" },
  { keywords: ["travel", "flight", "trip", "book ticket"], icon: FaPlane, color: "#0ea5e9" },
];

const DEFAULT_ICON = { icon: FaTasks, color: "#64748b" };

const getIconForTask = (text = "") => {
  const lower = text.toLowerCase();
  const match = ICON_RULES.find((rule) => rule.keywords.some((kw) => lower.includes(kw)));
  return match || DEFAULT_ICON;
};

const formatTime = (hhmm) => {
  if (!hhmm) return "Any Time";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
};

const toMinutes = (hhmm) => {
  if (!hhmm) return 9999;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export default function SmartDailyPlanner({ tasks = [] }) {
  const sortedTasks = [...tasks].sort(
    (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)
  );

  return (
    <div className="glass-card planner-card">
      <div className="planner-header">
        {/* <FaRobot className="planner-icon" /> */}
        <span className="lifeos-ai-icon">
      ✨
    </span>
        <h3>AI Smart Daily Planner</h3>
      </div>

      <div className="planner-list">
        {sortedTasks.length === 0 ? (
          <p>No tasks available.</p>
        ) : (
          sortedTasks.map((task) => {
            const { icon: Icon, color } = getIconForTask(task.text);

            return (
              <div className="planner-item" key={task._id ?? task.text}>
                <div className="planner-circle" style={{ background: color }}>
                  <Icon />
                </div>

                <div className="planner-content">
                  <h4>{task.text}</h4>
                  <small>
                    {formatTime(task.startTime)} – {formatTime(task.endTime)} · {task.priority || "Medium"} Priority
                  </small>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}