const express = require("express");
const router = express.Router();
const {
  getTodayMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} = require("../controllers/meetingController");

// ⚠️ Adjust this import to match your actual auth middleware file/name
const { protect } = require("../middleware/authMiddleware");

router.get("/today", protect, getTodayMeetings);
router.post("/", protect, createMeeting);
router.put("/:id", protect, updateMeeting);
router.delete("/:id", protect, deleteMeeting);

module.exports = router;