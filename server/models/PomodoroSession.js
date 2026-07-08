const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  duration: Number,
  completedAt: Date
});

module.exports = mongoose.model("PomodoroSession", schema);