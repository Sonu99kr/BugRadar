const { Worker, Backoffs } = require("bullmq");
const pool = require("../config/db");
const { connection } = require("../config/queue");

const worker = new Worker(
  "error-ingestion",
  async (job) => {
    const { projectId, fingerprint, message, stack, url, userAgent, metadata } =
      job.data;

    await pool.query(
      `INSERT INTO error_groups (id, project_id, fingerprint, message, stack)
        VALUES (UUID(), ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          count = count+1,
          last_seen = CURRENT_TIMESTAMP`,
      [projectId, fingerprint, message, stack],
    );

    const [rows] = await pool.query(
      `SELECT id FROM error_groups
    WHERE project_id = ? AND fingerprint = ?`,
      [projectId, fingerprint],
    );

    if (rows.length === 0) {
      throw new Error(`error_group not found for fingerprint: ${fingerprint}`);
    }

    const groupId = rows[0].id;

    await pool.query(
      `INSERT INTO occurrences (id, group_id, url, user_agent, metadata)
     VALUES (UUID(), ?, ?, ?, ?)`,
      [
        groupId,
        url || null,
        userAgent || null,
        metadata ? JSON.stringify(metadata) : null,
      ],
    );

    console.log(`Job ${job.id} processed — fingerprint: ${fingerprint}`);
  },
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    },
  },
);

worker.on("completed", (job) => {
  console.log(`✓ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(
    `✗ Job ${job.id} attempt ${job.attemptsMade} failed: ${err.message}`,
  );
});

process.on("SIGTERN", async () => {
  console.log("Worker shutting down gracefully...");
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Worker shutting down gracefully...");
  await worker.close();
  process.exit(0);
});

module.exports = worker;
