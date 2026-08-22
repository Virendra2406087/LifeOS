import { useEffect, useState } from "react";
import { FaGoogle, FaCalendarAlt, FaSpinner, FaMapMarkerAlt, FaVideo } from "react-icons/fa";
import gmailService from "../../services/gmailService";

export default function GmailMeetingSync() {
  const [connected, setConnected] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const res = await gmailService.getMeetings();
        setMeetings(res.meetings || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = gmailService.connectUrl();
  };

  const formatRange = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const opts = { hour: "numeric", minute: "2-digit" };
    return `${s.toLocaleTimeString("en-US", opts)} - ${e.toLocaleTimeString("en-US", opts)}`;
  };

  return (
    <div className="glass-card gmail-card">
      <div className="gmail-header">
        <FaGoogle />
        <h3>Gmail Meeting Sync</h3>
      </div>

      {loading && (
        <div className="gmail-loading">
          <FaSpinner className="spin" /> Loading meetings...
        </div>
      )}

      {!loading && error && <div className="gmail-error">{error}</div>}

      {!loading && !error && !connected && (
        <>
          <div className="gmail-empty">
            Connect Gmail to sync your upcoming Calendar meetings.
          </div>
          <button className="gmail-btn" onClick={handleConnect}>
            Connect Gmail
          </button>
        </>
      )}

      {!loading && !error && connected && meetings.length === 0 && (
        <div className="gmail-empty">No meetings in the next 7 days.</div>
      )}

      {!loading &&
        !error &&
        connected &&
        meetings.map((meeting) => (
          <div key={meeting.id} className="meeting-item">
            <FaCalendarAlt className="meeting-icon" />
            <div>
              <h4>{meeting.title}</h4>
              <small>{formatRange(meeting.start, meeting.end)}</small>
              {meeting.location && (
                <small className="meeting-extra">
                  <FaMapMarkerAlt /> {meeting.location}
                </small>
              )}
              {meeting.meetLink && (
                <a
                  href={meeting.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="meeting-link"
                >
                  <FaVideo /> Join
                </a>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}