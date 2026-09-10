const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

  // Links this record to the Clerk user (e.g. "user_3IoRTcsEF2...")
  clerkId: {
    type: String,
    unique: true,
    sparse: true, // allows old pre-Clerk records without this field to still exist
  },

  name: {
    type: String
  },

  email: {
    type: String,
    unique: true,
    sparse: true
  },

  password: {
    type: String
  },

  // Google OAuth
  googleId: {
    type: String,
    default: null
  },

  memberSince: {
    type: String,
    default: () => new Date().toLocaleDateString("en-US", {
      month: "long", year: "numeric"
    })
  },

  google: {
    connected: { type: Boolean, default: false },
    accessToken: { type: String },
    refreshToken: { type: String },
  },

  avatar: {
    type: String,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);