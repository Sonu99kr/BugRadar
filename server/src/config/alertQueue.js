const { Queue } = require("bullmq");
const { connection } = require("./queue");

const alertQueue = new Queue("error-alerts", { connection });

module.exports = { alertQueue };
