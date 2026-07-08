const Task = require("../models/Task");

/* GET — only this user's tasks */
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ startTime: 1 });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/* POST — attach user id to new task */
exports.createTask = async (req, res) => {
  try {
    const { text, date, startTime, endTime, priority } = req.body;
    if (!text || !date || !startTime || !endTime) {
      return res.status(400).json({ message: "All fields required" });
    }
    const task = new Task({ user: req.user.id, text, date, startTime, endTime, priority });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/* PATCH — update any fields (completed, date for reschedule, etc.) */
exports.updateTask = async (req, res) => {
  try {
    const allowedFields = ["completed", "date", "startTime", "endTime", "priority", "text"];
    const updates = {};
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updates,
      { new: true }
    );

    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error updating task" });
  }
};

/* DELETE — only own tasks */
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/* Keep completeTask as alias for backward compat */
exports.completeTask = exports.updateTask;