const { verifyToken } = require("@clerk/backend");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // payload.sub is Clerk's user ID, e.g. "user_2abcXYZ..."
    req.user = { id: payload.sub };
    next();
  } catch (err) {
    console.error("Clerk token verification failed:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = protect;
module.exports.protect = protect;