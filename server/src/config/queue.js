const { Queue } = require("bullmq");
const Redis = require("ioredis");

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
};

const errorQueue = new Queue("error-ingestion", { connection });

const publisher = new Redis(connection);

module.exports = { errorQueue, connection, publisher };
