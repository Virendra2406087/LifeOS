const passport       = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt            = require("jsonwebtoken");
const User           = require("../models/User");

const SECRET = process.env.JWT_SECRET || "lifeos_secret_key";

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email    = profile.emails[0].value;
        const name     = profile.displayName;
        const googleId = profile.id;
        const avatar   = profile.photos?.[0]?.value || null;

        // Check if user already exists
        let user = await User.findOne({ email });

        if (user) {
          // ── Returning user — update googleId if not set, keep everything else ──
          if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
          }
        } else {
          // ── New user — create with Google data ──
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

        // Generate JWT
        const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "30d" });

        return done(null, { user, token });

      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((data, done)   => done(null, data));
passport.deserializeUser((data, done) => done(null, data));