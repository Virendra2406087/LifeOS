const Meeting = require("../models/Meeting");

// GET /api/meetings/today
// Kept the route/function name for backward compatibility, but now returns
// today + the next 7 days rather than only today — since meetings added
// from emails can legitimately be for a future date, and the old
// today-only window silently hid anything not dated today.
exports.getTodayMeetings = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sevenDaysOut = new Date(startOfDay);
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
    sevenDaysOut.setHours(23, 59, 59, 999);

    const meetings = await Meeting.find({
      user: req.user.id,
      date: { $gte: startOfDay, $lte: sevenDaysOut },
    }).sort({ date: 1, startTime: 1 });

    const formatted = meetings.map((m) => ({
      _id: m._id,
      title: m.title,
      date: m.date, // now included so the frontend can display/sort by the real date
      time: `${m.startTime} - ${m.endTime}`,
      prep: m.prep,
      follow: m.follow,
      color: m.color,
      link: m.link,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error("getTodayMeetings error:", err.message);
    res.status(500).json({ message: "Failed to fetch meetings" });
  }
};

// POST /api/meetings
exports.createMeeting = async (req, res) => {
  try {
    const { title, date, startTime, endTime, prep, follow, color, link } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: "title, startTime, endTime are required" });
    }

    const meeting = await Meeting.create({
      user: req.user.id,
      title,
      date: date || new Date(),
      startTime,
      endTime,
      prep,
      follow,
      color,
      link,
    });

    res.status(201).json(meeting);
  } catch (err) {
    console.error("createMeeting error:", err.message);
    res.status(500).json({ message: "Failed to create meeting" });
  }
};

// PUT /api/meetings/:id
exports.updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.status(200).json(meeting);
  } catch (err) {
    console.error("updateMeeting error:", err.message);
    res.status(500).json({ message: "Failed to update meeting" });
  }
};

// DELETE /api/meetings/:id
exports.deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.status(200).json({ message: "Meeting deleted" });
  } catch (err) {
    console.error("deleteMeeting error:", err.message);
    res.status(500).json({ message: "Failed to delete meeting" });
  }
};