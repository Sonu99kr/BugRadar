const sanitizeHtml = require("sanitize-html");

const sanitize = (str) =>
  sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
  });

const validatePayload = async (req, res, next) => {
  const { message, stack, url, userAgent, metadata } = req.body;

  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "message is required" });
  }

  if (!stack || typeof stack !== "string" || stack.trim() === "") {
    return res.status(400).json({ error: "stack is required" });
  }

  if (message.length > 1000) {
    return res.status(400).json({ error: "message too long(max 1000 chars)" });
  }

  if (stack.length > 5000) {
    return res.status(400).json({ error: "stack too long(max 5000 chars)" });
  }

  if (url && typeof url !== "string") {
    return res.status(400).json({ error: "url must be a string" });
  }

  if (userAgent && typeof userAgent !== "string") {
    return res.status(400).json({ error: "userAgent must be a string" });
  }

  if (metadata !== undefined) {
    if (
      typeof metadata !== "object" ||
      Array.isArray(metadata) ||
      metadata === null
    ) {
      return res.status(400).json({ error: "metadata must be a plain object" });
    }
  }

  req.body.message = sanitize(message.trim());
  req.body.stack = sanitize(stack.trim());
  if (url) req.body.url = sanitize(url.trim());
  if (userAgent) req.body.userAgent = sanitize(userAgent.trim());

  next();
};

module.exports = validatePayload;
