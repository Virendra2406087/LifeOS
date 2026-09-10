const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    prep: {
      type: String,
      default: "",
    },
    follow: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "#3b82f6",
    },
    link: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", meetingSchema);