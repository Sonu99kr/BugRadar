const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const authMiddleware = require("../middleware/authMiddleware");
const { hashApiKey } = require("../middleware/auth");

const generateApiKey = () => {
  const random = crypto.randomBytes(24).toString("hex");
  return `br_live_${random}`;
};

router.get("/", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, created_at FROM projects
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id],
    );

    res.status(200).json({ projects: rows });
  } catch (err) {
    console.error("Get projects error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Project name is required" });
    }

    if (name.trim().length > 100) {
      return res
        .status(400)
        .json({ error: "Project name too long (max 100 chars)" });
    }

    const [countRows] = await pool.query(
      "SELECT COUNT(*) as count FROM projects WHERE user_id = ?",
      [req.user.id],
    );

    if (countRows[0].count >= 10) {
      return res.status(429).json({ error: "Project limit reached (max 10)" });
    }

    const plainKey = generateApiKey();
    const hashedKey = hashApiKey(plainKey);
    const projectId = uuidv4();

    await pool.query(
      "INSERT INTO projects (id, user_id, name, api_key) VALUES (?, ?, ?, ?)",
      [projectId, req.user.id, name.trim(), hashedKey],
    );

    res.status(201).json({
      project: {
        id: projectId,
        name: name.trim(),
        created_at: new Date().toISOString(),
      },

      apiKey: plainKey,
    });
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      "SELECT id FROM projects WHERE id = ? AND user_id = ?",
      [id, req.user.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    await pool.query("DELETE FROM projects WHERE id = ?", [id]);

    res.status(200).json({ message: "Project deleted" });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, created_at FROM projects WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.status(200).json({ project: rows[0] });
  } catch (err) {
    console.error("Get project error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/errors", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Ownership check — project must belong to logged in user
    const [projectRows] = await pool.query(
      "SELECT id, name FROM projects WHERE id = ? AND user_id = ?",
      [id, req.user.id],
    );

    if (projectRows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Get error groups sorted by last_seen
    const [errors] = await pool.query(
      `SELECT
        id,
        message,
        stack,
        count,
        first_seen,
        last_seen
       FROM error_groups
       WHERE project_id = ?
       ORDER BY last_seen DESC
       LIMIT ? OFFSET ?`,
      [id, limit, offset],
    );

    // Total count for pagination
    const [countRows] = await pool.query(
      "SELECT COUNT(*) as total FROM error_groups WHERE project_id = ?",
      [id],
    );

    // Total occurrences across all groups
    const [occurrenceRows] = await pool.query(
      "SELECT SUM(count) as total FROM error_groups WHERE project_id = ?",
      [id],
    );

    res.status(200).json({
      project: projectRows[0],
      errors,
      pagination: {
        total: countRows[0].total,
        page,
        limit,
        pages: Math.ceil(countRows[0].total / limit),
      },
      stats: {
        totalGroups: countRows[0].total,
        totalOccurrences: occurrenceRows[0].total || 0,
        lastSeen: errors.length > 0 ? errors[0].last_seen : null,
      },
    });
  } catch (err) {
    console.error("Get errors error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/trend", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const range = req.query.range || "24h";

    // Ownership check
    const [projectRows] = await pool.query(
      "SELECT id FROM projects WHERE id = ? AND user_id = ?",
      [id, req.user.id],
    );

    if (projectRows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    let query;

    if (range === "24h") {
      query = `
        SELECT
          DATE_FORMAT(o.created_at, '%H:00') as label,
          DATE_FORMAT(o.created_at, '%Y-%m-%d %H:00:00') as group_key,
          COUNT(*) as count
        FROM occurrences o
        JOIN error_groups eg ON o.group_id = eg.id
        WHERE eg.project_id = ?
          AND o.created_at >= NOW() - INTERVAL 24 HOUR
        GROUP BY group_key, label
        ORDER BY group_key ASC
      `;
    } else if (range === "7d") {
      query = `
        SELECT
          DATE_FORMAT(o.created_at, '%b %d') as label,
          DATE(o.created_at) as group_key,
          COUNT(*) as count
        FROM occurrences o
        JOIN error_groups eg ON o.group_id = eg.id
        WHERE eg.project_id = ?
          AND o.created_at >= NOW() - INTERVAL 7 DAY
        GROUP BY group_key, label
        ORDER BY group_key ASC
      `;
    } else {
      query = `
        SELECT
          DATE_FORMAT(o.created_at, '%b %d') as label,
          DATE(o.created_at) as group_key,
          COUNT(*) as count
        FROM occurrences o
        JOIN error_groups eg ON o.group_id = eg.id
        WHERE eg.project_id = ?
          AND o.created_at >= NOW() - INTERVAL 30 DAY
        GROUP BY group_key, label
        ORDER BY group_key ASC
      `;
    }

    const [rows] = await pool.query(query, [id]);

    // Strip group_key from response — frontend only needs label + count
    const trend = rows.map(({ label, count }) => ({ label, count }));

    res.status(200).json({ trend, range });
  } catch (err) {
    console.error("Trend error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/occurrences", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    // Ownership check
    const [projectRows] = await pool.query(
      "SELECT id FROM projects WHERE id = ? AND user_id = ?",
      [id, req.user.id],
    );

    if (projectRows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const [rows] = await pool.query(
      `SELECT
        o.id,
        o.url,
        o.user_agent,
        o.created_at,
        eg.message,
        eg.fingerprint
       FROM occurrences o
       JOIN error_groups eg ON o.group_id = eg.id
       WHERE eg.project_id = ?
       ORDER BY o.created_at DESC
       LIMIT ?`,
      [id, limit],
    );

    // Parse browser name from user agent
    const parseBrowser = (ua) => {
      if (!ua) return "Unknown";
      if (ua.includes("Firefox")) return "Firefox";
      if (ua.includes("Edg")) return "Edge";
      if (ua.includes("Chrome")) return "Chrome";
      if (ua.includes("Safari")) return "Safari";
      if (ua.includes("Opera")) return "Opera";
      return "Unknown";
    };

    // Parse OS from user agent
    const parseOS = (ua) => {
      if (!ua) return "Unknown";
      if (ua.includes("Windows")) return "Windows";
      if (ua.includes("Mac")) return "macOS";
      if (ua.includes("Linux")) return "Linux";
      if (ua.includes("Android")) return "Android";
      if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
      return "Unknown";
    };

    const occurrences = rows.map((row) => ({
      id: row.id,
      message: row.message,
      url: row.url,
      browser: parseBrowser(row.user_agent),
      os: parseOS(row.user_agent),
      created_at: row.created_at,
    }));

    res.status(200).json({ occurrences });
  } catch (err) {
    console.error("Occurrences error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
