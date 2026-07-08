const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  text: {
    type: String,
    required: true
  },

  // Store as String "YYYY-MM-DD" — avoids UTC timezone shift bug
  // If stored as Date, MongoDB converts to UTC and shifts the day
  // for users in UTC+ timezones (e.g. India UTC+5:30)
  date: {
    type: String,
    required: true
  },

  startTime: {
    type: String,
    required: true
  },

  endTime: {
    type: String,
    required: true
  },

  priority: {
    type: String,
    default: "purple"
  },

  completed: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("Task", TaskSchema);