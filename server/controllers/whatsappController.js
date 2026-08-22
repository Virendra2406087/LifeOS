const WhatsAppReminder = require("../models/WhatsAppReminder");

const getReminders = async (req, res) => {
  try {
    const reminders = await WhatsAppReminder.find({ user: req.user.id }).sort({ time: 1 });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createReminder = async (req, res) => {
  try {
    const { name, phone, message, time, type } = req.body;
    if (!name || !phone || !message || !time) {
      return res.status(400).json({ message: "name, phone, message and time are required" });
    }
    const reminder = await WhatsAppReminder.create({
      user: req.user.id,
      name,
      phone,
      message,
      time,
      type: type || "Reminder",
    });
    res.status(201).json(reminder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/whatsapp/reminders/:id — used by the Dashboard alarm popup's
// "Extend Time" action to push a reminder's time forward. Resets status
// to "pending" since a rescheduled reminder shouldn't be treated as sent.
const updateReminder = async (req, res) => {
  try {
    const { time } = req.body;
    if (!time) return res.status(400).json({ message: "time is required" });

    const reminder = await WhatsAppReminder.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { time, status: "pending" },
      { new: true, runValidators: true }
    );

    if (!reminder) return res.status(404).json({ message: "Reminder not found" });
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteReminder = async (req, res) => {
  try {
    const reminder = await WhatsAppReminder.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!reminder) return res.status(404).json({ message: "Reminder not found" });
    res.json({ message: "Reminder deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getReminders, createReminder, updateReminder, deleteReminder };