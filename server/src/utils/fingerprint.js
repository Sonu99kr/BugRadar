const crypto = require("crypto");

const parseStackTrace = (stack) => {
  if (!stack) return { filename: "unknown", line: "0" };

  const lines = stack.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed.startsWith("at ")) continue;

    const match =
      trimmed.match(/\((.+):(\d+):\d+\)$/) ||
      trimmed.match(/at (.+):(\d+):\d+$/);

    if (match) {
      const rawFileName = match[1];
      const line = match[2];

      const filename = rawFileName
        .replace(/^https?:\/\/[^/]+/, "")
        .replace(/\?.*$/, "")
        .trim();

      return { filename, line };
    }
  }

  return { filename: "unknown", line: "0" };
};

const generateFingerprint = (message, stack) => {
  const { filename, line } = parseStackTrace(stack);

  const raw = `${message}|${filename}|${line}`;

  return crypto.createHash("sha256").update(raw).digest("hex");
};

module.exports = { generateFingerprint, parseStackTrace };
