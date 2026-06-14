const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

require("./src/workers/errorWorker");

const ingest = require("./src/routes/ingest");
const auth = require("./src/routes/auth");

const app = express();

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

app.use("/api/auth", auth);
app.use("/api/projects", require("./src/routes/projects"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

//routes

//api ingestion
app.use("/api/ingest", ingest);

const PORT = process.env.PORT || 5020;
app.listen(PORT, () => {
  console.log(`BugRadar server is running on ${PORT}`);
});
