const { sortTasks } = require("../services/priorityAIService");

const getPriorityTasks = async (req, res) => {
  try {
    const tasks = req.body.tasks || [];

    const sortedTasks = sortTasks(tasks);

    res.status(200).json({
      success: true,
      total: sortedTasks.length,
      tasks: sortedTasks,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to calculate AI priorities",
    });
  }
};

module.exports = {
  getPriorityTasks,
};