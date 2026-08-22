const mongoose = require("mongoose");

const callReminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    person: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    time: { type: String, required: true },
    message: { type: String, default: "This is a reminder from LifeOS." },
    status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
    callSid: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CallReminder", callReminderSchema);