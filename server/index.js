const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

require("./src/workers/errorWorker");

const ingest = require("./src/routes/ingest");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: "*", // during development allow all origins
    methods: ["POST", "GET"],
    allowedHeaders: ["Content-Type", "x-api-key"],
  }),
);
app.use(express.json({ limit: "1mb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many request" },
  skip: (req) => req.method === "OPTIONS",
});
app.use("/api/", limiter);

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
