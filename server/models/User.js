const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  // Google OAuth
  googleId: {
    type: String,
    default: null
  },

  // Stored so returning users see their original join date
  memberSince: {
    type: String,
    default: () => new Date().toLocaleDateString("en-US", {
      month: "long", year: "numeric"
    })
  },

  avatar: {
    type: String,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);