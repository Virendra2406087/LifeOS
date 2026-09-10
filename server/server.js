require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const aiRoutes = require("./routes/ai");
const aiPriorityRoutes = require("./routes/aiPriorityRoutes");
const mlRoutes = require("./routes/mlRoutes");
const callRoutes = require("./routes/callRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");
const gmailRoutes = require("./routes/gmailRoutes");
const meetingRoutes = require("./routes/meetingRoutes.js");


console.log(MongoStore);
// Google OAuth config
require("./config/googleAuth");

// Fail fast if critical secrets are missing
if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is not set");
if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set");

const app = express();

// Render (and most cloud hosts) sit behind a reverse proxy — required
// for secure cookies to be set/read correctly in production
app.set("trust proxy", 1);

// =============================
// Middleware
// =============================
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day — adjust to taste
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use("/api/meetings", meetingRoutes);

// =============================
// MongoDB Connection
// =============================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// =============================
// Routes
// =============================
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/ai", aiPriorityRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/gmail", gmailRoutes);

// =============================
// Test Route
// =============================
app.get("/", (req, res) => {
  res.send("LifeOS API Running");
});

// =============================
// Server Start
// =============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});