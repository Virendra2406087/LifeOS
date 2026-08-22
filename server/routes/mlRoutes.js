const express = require("express");
const router = express.Router();

const {
  getProductivityPrediction,
  getPriorityPrediction,
  predictTaskPriority,
  getSchedulerPrediction,
  getBurnoutPrediction,
  getHabitPrediction,
} = require("../controllers/mlController");
const { predictTaskDuration } = require("../controllers/mlController");
const { predictTaskScheduler } = require("../controllers/mlController");
router.post("/scheduler/task", predictTaskScheduler);

router.post("/productivity", getProductivityPrediction);
router.post("/priority", getPriorityPrediction);
router.post("/priority/task", predictTaskPriority);
router.post("/scheduler", getSchedulerPrediction);
router.post("/burnout", getBurnoutPrediction);
router.post("/habits", getHabitPrediction);
router.post("/duration/task", predictTaskDuration);

module.exports = router;