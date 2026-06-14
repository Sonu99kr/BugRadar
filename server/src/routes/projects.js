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

module.exports = router;
