const { tryCatch } = require("bullmq");
const pool = require("../config/db");

const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({ error: "API key missing" });
    }

    const [rows] = await pool.query(
      "SELECT id From projects WHERE api_key = ?",
      [apiKey],
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    req.projectId = rows[0].id;

    next();
  } catch (error) {
    console.log("Auth middleware error", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = validateApiKey;
