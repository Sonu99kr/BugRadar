const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query(
      "SELECT id, email FROM users WHERE id = ?",
      [decoded.userId],
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = authMiddleware;
