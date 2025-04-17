// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "your-secret-key";

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    req.user = decoded; // Attach user data to request
    next(); // Continue to route
  } catch (err) {
    return res.status(401).json({
      message:
        err.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
    });
  }
}

module.exports = verifyToken;
