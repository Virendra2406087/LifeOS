require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const aiRoutes = require("./routes/ai");

// Google OAuth config
require("./config/googleAuth");

const app = express();

// =============================
// Middleware
// =============================
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());

app.use(
  session({
    secret: "lifeos-secret-key",
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());

// =============================
// MongoDB Connection
// =============================
mongoose.connect("mongodb://127.0.0.1:27017/lifeos")
.then(()=>console.log("✅ MongoDB Connected"))
.catch(err=>console.log("❌ MongoDB Error:",err));

// =============================
// Routes
// =============================
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/ai", aiRoutes);

// =============================
// Test Route
// =============================
app.get("/", (req, res) => {
  res.send("🚀 LifeOS API Running");
});

// =============================
// Server Start
// =============================
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});