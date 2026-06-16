const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const path = require("path");
const http = require("http");
require("dotenv").config();

require("./src/workers/errorWorker");

const ingest = require("./src/routes/ingest");
const auth = require("./src/routes/auth");
const project = require("./src/routes/projects");

const REQUIRED_ENV = [
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "REDIS_URL",
  "JWT_SECRET",
];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error("Missing required env vars:", missing.join(", "));
  process.exit(1);
}

const { setupWebSocket } = require("./src/websocket");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["POST", "GET", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "x-api-key"],
  }),
);

app.use("/api/ingest", cors({ origin: "*" }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many request" },
  skip: (req) => req.method === "OPTIONS",
});

app.use("/api/", limiter);

app.use(
  "/sdk",
  express.static(path.join(__dirname, "sdk"), {
    setHeaders: (res) => {
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Cache-Control", "public, max-age=3600");
    },
  }),
);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", auth);
app.use("/api/projects", project);
app.use("/api/ingest", ingest);

const server = http.createServer(app);
setupWebSocket(server);

const PORT = process.env.PORT || 5020;
server.listen(PORT, () => {
  console.log(`BugRadar server is running on ${PORT}`);
});
