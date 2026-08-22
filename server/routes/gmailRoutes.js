const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { protect } = require("../middleware/authMiddleware");
const {
  getConnectionStatus,
  getSmartTasks,
  getMeetings,
  getAIMeetings,
  addMeetingFromEmail,
} = require("../controllers/gmailController");

const SECRET = process.env.JWT_SECRET || "lifeos_secret_key";

// Initiates the Gmail/Calendar OAuth consent flow for an already-logged-in
// user. This is a full-page redirect (window.location.href), so it can't
// carry an Authorization header — the JWT is passed as a query param and
// verified here instead, then stashed in session for the OAuth callback.
router.get("/auth", (req, res, next) => {
  const { token } = req.query;

  if (!token) {
    return res.status(401).send("Missing auth token");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, SECRET);
  } catch (err) {
    return res.status(401).send("Invalid or expired token");
  }

  req.session.gmailConnectUserId = decoded.id;

  // Explicitly save before handing off to passport's redirect — without
  // this, the session write can race with the OAuth redirect and the
  // callback sees an empty session (the "User not found" error).
  req.session.save((err) => {
    if (err) {
      console.error("Session save error:", err);
      return res.status(500).send("Session error, please try again");
    }

    passport.authenticate("google", {
      scope: [
        "profile",
        "email",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/calendar.readonly",
      ],
      accessType: "offline",
      prompt: "consent",
    })(req, res, next);
  });
});

router.get("/status", protect, getConnectionStatus);
router.get("/smart-tasks", protect, getSmartTasks);
router.get("/meetings", protect, getMeetings);
router.get("/ai-meetings", protect, getAIMeetings);
router.post("/add-meeting/:messageId", protect, addMeetingFromEmail);


module.exports = router;