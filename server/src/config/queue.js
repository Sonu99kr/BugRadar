const { Queue } = require("bullmq");
const Redis = require("ioredis");

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

const publisher = new Redis(redisUrl);

const errorQueue = new Queue("error-ingestion", { connection });

module.exports = { errorQueue, connection, publisher };
