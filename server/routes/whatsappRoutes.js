const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
} = require("../controllers/whatsappController");

router.route("/reminders").get(protect, getReminders).post(protect, createReminder);
router.route("/reminders/:id").put(protect, updateReminder).delete(protect, deleteReminder);

module.exports = router;