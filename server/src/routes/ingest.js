const express = require("express");
const router = express.Router();
const validateApiKey = require("../middleware/auth");

router.post("/", validateApiKey, async (req, res) => {
  try {
    const { message, stack, url, userAgent, metadata } = req.body;

    console.log("Incoming error logs:", {
      projectId: req.projectId,
      message,
      stack,
      url,
      userAgent,
      metadata,
    });

    res.status(200).json({ received: true });
  } catch (error) {
    console.log("Ingestion error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
