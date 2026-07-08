const mongoose = require("mongoose");

const statSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  tasksCompleted: Number,
  focusMinutes: Number,
  date: Date
});

module.exports = mongoose.model("ProductivityStat", statSchema);