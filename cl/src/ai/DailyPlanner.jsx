import {
  FaRobot,
  FaClock,
  FaCheckCircle,
  FaCoffee,
  FaLaptop,
  FaRunning,
} from "react-icons/fa";

export default function DailyPlanner() {

  const planner = [
    {
      time: "8:00 AM",
      task: "Morning Planning",
      icon: <FaCheckCircle />,
      color: "#8b5cf6",
    },
    {
      time: "9:00 AM",
      task: "Attend Team Meeting",
      icon: <FaLaptop />,
      color: "#3b82f6",
    },
    {
      time: "11:00 AM",
      task: "Deep Work Session",
      icon: <FaRobot />,
      color: "#10b981",
    },
    {
      time: "1:00 PM",
      task: "Lunch Break",
      icon: <FaCoffee />,
      color: "#f97316",
    },
    {
      time: "3:00 PM",
      task: "Project Development",
      icon: <FaLaptop />,
      color: "#6366f1",
    },
    {
      time: "6:00 PM",
      task: "Workout",
      icon: <FaRunning />,
      color: "#ef4444",
    },
    {
      time: "9:00 PM",
      task: "Review Tomorrow's Tasks",
      icon: <FaClock />,
      color: "#8b5cf6",
    },
  ];

  return (
    <div className="glass-card planner-card">

      <div className="planner-header">
        <FaRobot className="planner-icon"/>
        <h3>AI Daily Planner</h3>
      </div>

      <div className="planner-list">

        {planner.map((item,index)=>(
          <div className="planner-item" key={index}>

            <div
              className="planner-circle"
              style={{background:item.color}}
            >
              {item.icon}
            </div>

            <div className="planner-content">
              <h4>{item.task}</h4>
              <small>{item.time}</small>
            </div>

          </div>
        ))}

      </div>

    </div>
  );
}