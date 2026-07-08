import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { trackTask } from "../../utils/history";
import TimePicker from "../common/TimePicker";

export default function AddTaskForm({ addTask }) {

  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [taskName, setTaskName] = useState("");
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [priority, setPriority] = useState("purple");

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!taskName || !date || !startTime || !endTime) {
      alert("Please fill all fields");
      return;
    }

    if (startTime >= endTime) {
      alert("End time must be after start time");
      return;
    }

    const task = {
      text: taskName,
      date,
      startTime,
      endTime,
      priority,
      completed: false
    };

    try {

      const res = await axios.post("http://localhost:5000/api/tasks", task);

      if (addTask) addTask(res.data);

      trackTask(taskName);

      alert("Task Added Successfully ✅");

      setTaskName("");
      setDate(today);
      setStartTime("");
      setEndTime("");
      setPriority("purple");

      navigate("/dashboard");

    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(err.response?.data?.error || "Error saving task");
    }

  };

  return (
    <div className="glass-card">

      <h3>Add Task Schedule</h3>

      <form onSubmit={handleSubmit}>

        <div className="settings-item">
          <label>Task Name</label>
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Enter task"
            required
          />
        </div>

        <div className="settings-item">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* iOS-style time pickers */}
        <div className="settings-item">
          <TimePicker
            label="Start Time"
            value={startTime}
            onChange={setStartTime}
          />
        </div>

        <div className="settings-item">
          <TimePicker
            label="End Time"
            value={endTime}
            onChange={setEndTime}
          />
        </div>

        <div className="settings-item">
          <label>Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="purple">High</option>
            <option value="blue">Medium</option>
            <option value="gray">Low</option>
          </select>
        </div>

        <button type="submit" className="accept">
          ➕ Add Task
        </button>

      </form>

    </div>
  );
}