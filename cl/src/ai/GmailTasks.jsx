import { useEffect, useState } from "react";
import { FaGoogle, FaCalendarAlt, FaSpinner, FaCalendarPlus, FaCheck } from "react-icons/fa";
import toast from "react-hot-toast";
import gmailService from "../services/gmailService";

export default function GmailTasks() {
  const [connected, setConnected] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await gmailService.getStatus();
      setConnected(status.connected);

      if (status.connected) {
        const res = await gmailService.getSmartTasks();
        setTasks(res.tasks || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load Gmail tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = gmailService.connectUrl();
  };

  const handleAddMeeting = async (taskId) => {
    setAddingId(taskId);
    try {
      await gmailService.addMeetingFromEmail(taskId);
      setAddedIds((prev) => new Set(prev).add(taskId));
      toast.success("Meeting added ✅");
      // Tell SmartMeetingAssistant (sibling component) to refresh its list
      window.dispatchEvent(new CustomEvent("meeting:added"));
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Couldn't detect a clear meeting time in this email";

      // Quota errors (429) get a longer toast since the person needs time
      // to actually read the "try again later or add manually" guidance,
      // not just a quick flash.
      const isQuotaError = err.response?.status === 429;
      toast.error(message, { duration: isQuotaError ? 5000 : 3500 });
    } finally {
      setAddingId(null);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const isToday = d.toDateString() === new Date().toDateString();
    return isToday
      ? "Today"
      : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div className="glass-card gmail-card">
      <div className="gmail-header">
        <FaGoogle className="gmail-icon" />
        <h3>Gmail Smart Tasks</h3>
      </div>

      {loading && (
        <div className="gmail-loading">
          <FaSpinner className="spin" /> Loading...
        </div>
      )}

      {!loading && error && <div className="gmail-error">{error}</div>}

      {!loading && !error && !connected && (
        <>
          <div className="gmail-empty">
            Connect your Gmail to auto-detect meetings, interviews and
            deadlines from your inbox.
          </div>
          <button className="gmail-btn" onClick={handleConnect}>
            Connect Gmail
          </button>
        </>
      )}

      {!loading && !error && connected && tasks.length === 0 && (
        <div className="gmail-empty">
          No meetings, interviews or deadlines found in your recent inbox.
        </div>
      )}

      {!loading &&
        !error &&
        connected &&
        tasks.map((task) => (
          <div className="gmail-item" key={task.id}>
            <div>
              <h4>{task.title}</h4>
              <p>
                <FaCalendarAlt /> {formatDate(task.receivedAt)} •{" "}
                {formatTime(task.receivedAt)}
              </p>
            </div>

            <div className="gmail-item-actions">
              <span className="gmail-tag">{task.type}</span>

              {(task.type === "Meeting" || task.type === "Interview") && (
                addedIds.has(task.id) ? (
                  <span className="gmail-added-badge">
                    <FaCheck /> Added
                  </span>
                ) : (
                  <button
                    className="gmail-add-meeting-btn"
                    onClick={() => handleAddMeeting(task.id)}
                    disabled={addingId === task.id}
                    title="Extract time and add to Smart Meeting Assistant"
                  >
                    {addingId === task.id ? (
                      <FaSpinner className="spin" />
                    ) : (
                      <FaCalendarPlus />
                    )}
                    {addingId === task.id
                      ? "Adding..."
                      : task.type === "Interview"
                      ? "Add Interview"
                      : "Add Meeting"}
                  </button>
                )
              )}
            </div>
          </div>
        ))}
    </div>
  );
}