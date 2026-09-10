const mongoose = require("mongoose");

const whatsappReminderSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String, required: true },
    time: { type: Date, required: true },
    type: {
      type: String,
      enum: ["Call", "Reply", "Document", "Reminder"],
      default: "Reminder",
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WhatsAppReminder", whatsappReminderSchema);