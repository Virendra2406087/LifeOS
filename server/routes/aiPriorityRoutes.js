const express = require("express");
const router = express.Router();

const {
  getPriorityTasks,
} = require("../controllers/aiPriorityController");

router.post("/priority", getPriorityTasks);

module.exports = router;