const express = require("express");
const router = express.Router();
const validateApiKey = require("../middleware/auth");
const validatePayload = require("../middleware/validatePayload");
const { generateFingerprint } = require("../utils/fingerprint");

router.post("/", validateApiKey, validatePayload, async (req, res) => {
  try {
    const { message, stack, url, userAgent, metadata } = req.body;

    const fingerprint = generateFingerprint(message, stack);

    console.log("Valid error payload received:", {
      projectId: req.projectId,
      fingerprint,
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
