const passport       = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt            = require("jsonwebtoken");
const User           = require("../models/User");

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
const SECRET = process.env.JWT_SECRET;
const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  `${SERVER_URL}/api/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email    = profile.emails[0].value;
        const name     = profile.displayName;
        const googleId = profile.id;
        const avatar   = profile.photos?.[0]?.value || null;

        // ── Gmail-connect flow ──
        if (req.session.gmailConnectUserId) {
          console.log("Gmail connect flow — session user ID:", req.session.gmailConnectUserId);

          const connectClerkId = req.session.gmailConnectUserId;
          delete req.session.gmailConnectUserId;

          const user = await User.findOneAndUpdate(
            { clerkId: connectClerkId },
            { $setOnInsert: { clerkId: connectClerkId } },
            { new: true, upsert: true }
          );

          user.google = {
            connected: true,
            accessToken,
            refreshToken: refreshToken || user.google?.refreshToken,
          };
          await user.save();

          return done(null, { user, isConnectFlow: true });
        }

        // ── Legacy passport login/signup flow — no longer reachable from
        // the frontend now that Clerk owns /login and /register, kept only
        // in case something still hits /api/auth/google directly. ──
        let user = await User.findOne({ email });

        if (user) {
          if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
          }
        } else {
          user = await User.create({
            name,
            email,
            password:     "google-oauth-" + googleId,
            googleId,
            avatar,
            memberSince:  new Date().toLocaleDateString("en-US", {
              month: "long", year: "numeric"
            })
          });
        }

        const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "30d" });

        return done(null, { user, token, isConnectFlow: false });

      } catch (err) {
        console.error("Google Strategy error:", err.message);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((data, done)   => done(null, data));
passport.deserializeUser((data, done) => done(null, data));