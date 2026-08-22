const User = require("../models/User");
const Meeting = require("../models/Meeting");
const {
  getSmartTasksFromGmail,
  getUpcomingMeetings,
  getAIExtractedMeetings,
  extractMeetingFromSingleEmail,
} = require("../services/gmailService");

const isGoogleConnected = (user) => Boolean(user?.google?.connected);

const getConnectionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ connected: isGoogleConnected(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSmartTasks = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!isGoogleConnected(user)) {
      return res.status(400).json({ message: "Gmail not connected", connected: false });
    }
    const tasks = await getSmartTasksFromGmail(user);
    res.json({ connected: true, tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAIMeetings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!isGoogleConnected(user)) {
      return res.status(400).json({ message: "Gmail not connected", connected: false });
    }
    const meetings = await getAIExtractedMeetings(user);
    res.json({ connected: true, meetings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMeetings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!isGoogleConnected(user)) {
      return res.status(400).json({ message: "Gmail not connected", connected: false });
    }
    const meetings = await getUpcomingMeetings(user);
    res.json({ connected: true, meetings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addMeetingFromEmail = async (req, res) => {
  try {
    const { messageId } = req.params;
    const user = await User.findById(req.user.id);

    if (!isGoogleConnected(user)) {
      return res.status(400).json({ message: "Gmail not connected", connected: false });
    }

    const extracted = await extractMeetingFromSingleEmail(user, messageId);

    if (!extracted.startTime || !extracted.endTime) {
      return res.status(422).json({ message: "Couldn't determine meeting time from this email" });
    }

    // Use the date Gemini extracted from the email ("YYYY-MM-DD") if valid;
    // otherwise fall back to today rather than silently discarding it.
    // Parsed as LOCAL midnight (not new Date("YYYY-MM-DD"), which is UTC
    // and can shift a day depending on server/DB timezone).
    let meetingDate = new Date();
    if (extracted.date && /^\d{4}-\d{2}-\d{2}$/.test(extracted.date)) {
      const [y, m, d] = extracted.date.split("-").map(Number);
      meetingDate = new Date(y, m - 1, d);
    }

    const meeting = await Meeting.create({
      user: req.user.id,
      title: extracted.title,
      date: meetingDate,
      startTime: extracted.startTime,
      endTime: extracted.endTime,
      prep: "",
      follow: "",
      color: "#a855f7", // purple, matches the AI-detected styling convention
      link: extracted.link,
    });

    res.status(201).json({ meeting });
  } catch (err) {
    // Quota errors get their own status code so the frontend can show an
    // honest message instead of the generic 500/"couldn't detect a clear
    // meeting time" — which was actively misleading during debugging.
    if (err.isQuotaError) {
      return res.status(429).json({
        message: "AI quota exceeded for today — try again later or add this meeting manually.",
      });
    }
    console.error("addMeetingFromEmail error:", err.message);
    res.status(500).json({ message: err.message || "Failed to add meeting" });
  }
};

module.exports = {
  getConnectionStatus,
  getSmartTasks,
  getMeetings,
  getAIMeetings,
  addMeetingFromEmail,
};