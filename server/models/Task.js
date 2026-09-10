const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({

  user: {
    type: String,
    required: true
  },

  text: {
    type: String,
    required: true
  },

  // YYYY-MM-DD
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

  // ==========================================
  // ML FEATURES
  // ==========================================

  importance: {
    type: Number,
    min: 1,
    max: 3,
    default: 2
  },

  category: {
    type: Number,
    min: 1,
    max: 4,
    default: 1
  },

  // ==========================================
  // Existing priority
  // ==========================================

  priority: {
    type: String,
    default: "purple"
  },

  completed: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

module.exports =
  mongoose.model("Task", TaskSchema);