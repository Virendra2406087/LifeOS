const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getReminders,
  createReminder,
  deleteReminder,
} = require("../controllers/callController");

router.route("/reminders").get(protect, getReminders).post(protect, createReminder);
router.route("/reminders/:id").delete(protect, deleteReminder);

module.exports = router;