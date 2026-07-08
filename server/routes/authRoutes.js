const express  = require("express");
const router   = express.Router();
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const passport = require("passport");
const User     = require("../models/User");

const SECRET = process.env.JWT_SECRET || "lifeos_secret_key";

/* ── REGISTER ── */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already registered" });

    const hashed  = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashed });
    await newUser.save();

    res.json({ message: "Registration successful" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Register failed" });
  }
});

/* ── LOGIN ── */
router.post("/login", async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User not found" });

    // Block Google-only accounts from password login
    if (user.googleId && user.password.startsWith("google-oauth-"))
      return res.status(400).json({
        message: "This account uses Google login. Please click 'Continue with Google'."
      });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ message: "Wrong password" });

    // Remember me → 30 days, otherwise 1 day
    const expiresIn = remember ? "30d" : "1d";
    const token     = jwt.sign({ id: user._id }, SECRET, { expiresIn });

    res.json({
      token,
      user: {
        id:          user._id,
        name:        user.name,
        email:       user.email,
        memberSince: user.memberSince,
        avatar:      user.avatar || null,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login error" });
  }
});

/* ── GOOGLE — Step 1: redirect ── */
router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/* ── GOOGLE — Step 2: callback ── */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:5173/login?error=google_failed"
  }),
  (req, res) => {
    const { user, token } = req.user;

    // Use the stored memberSince from DB (not today's date every time)
    const profile = JSON.stringify({
      name:        user.name,
      email:       user.email,
      role:        "Active Learner",
      plan:        "Free Plan",
      memberSince: user.memberSince,
      avatar:      user.avatar || null,
    });

    const params = new URLSearchParams({ token, user: profile });
    res.redirect(`http://localhost:5173/auth/callback?${params}`);
  }
);

module.exports = router;