const CallReminder = require("../models/CallReminder");

exports.getReminders = async (req, res) => {
  try {
    const reminders = await CallReminder.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(reminders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching call reminders" });
  }
};

exports.createReminder = async (req, res) => {
  try {
    const { name, phone, message, time } = req.body;
    if (!name || !phone || !message || !time) {
      return res.status(400).json({ message: "name, phone, message and time are required" });
    }

    const reminder = await CallReminder.create({
      user: req.user.id,
      person: name,
      phone,
      time,
      message,
    });

    res.status(201).json(reminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error creating call reminder" });
  }
};

exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await CallReminder.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!reminder) return res.status(404).json({ message: "Reminder not found" });
    res.json({ message: "Reminder deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error deleting call reminder" });
  }
};