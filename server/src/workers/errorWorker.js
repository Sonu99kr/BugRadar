const { Worker } = require("bullmq");
const { alertQueue } = require("../config/alertQueue");
const pool = require("../config/db");
const { connection, publisher } = require("../config/queue");

const worker = new Worker(
  "error-ingestion",
  async (job) => {
    const { projectId, fingerprint, message, stack, url, userAgent, metadata } =
      job.data;

    // Step 1 — insert or update error_groups
    await pool.query(
      `INSERT INTO error_groups (id, project_id, fingerprint, message, stack)
     VALUES (UUID(), ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       count = count + 1,
       last_seen = CURRENT_TIMESTAMP`,
      [projectId, fingerprint, message, stack],
    );

    // Step 2 — get the group_id
    const [rows] = await pool.query(
      `SELECT id, count FROM error_groups
     WHERE project_id = ? AND fingerprint = ?`,
      [projectId, fingerprint],
    );

    if (rows.length === 0) {
      throw new Error(`error_group not found for fingerprint: ${fingerprint}`);
    }

    const { id: groupId, count } = rows[0];

    // Step 3 — insert occurrence
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

    // ─── Alert threshold check ─────────────────────────────────────
    const THRESHOLDS = [10, 50, 100];
    const threshold = THRESHOLDS.find((t) => count === t);

    if (threshold) {
      // Check if this threshold was already alerted for this group
      const alertKey = `alert:${groupId}:${threshold}`;
      const alreadyAlerted = await publisher.get(alertKey);

      if (!alreadyAlerted) {
        // Mark as alerted in Redis — expires in 30 days
        await publisher.set(alertKey, "1", "EX", 60 * 60 * 24 * 30);

        // Get project owner email
        const [ownerRows] = await pool.query(
          `SELECT u.email, p.name as project_name
       FROM projects p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`,
          [projectId],
        );

        if (ownerRows.length > 0) {
          await alertQueue.add("send-alert", {
            to: ownerRows[0].email,
            projectName: ownerRows[0].project_name,
            errorMessage: message,
            count,
            threshold,
            projectId,
            groupId,
          });

          console.log(
            `🔔 Alert queued for ${ownerRows[0].email} — threshold ${threshold}`,
          );
        }
      }
    }

    // Step 4 — publish to Redis so WebSocket server can forward to dashboard
    const payload = JSON.stringify({
      type: "new_error",
      projectId,
      groupId,
      fingerprint,
      message,
      stack,
      count,
      url: url || null,
      timestamp: new Date().toISOString(),
    });

    await publisher.publish(`project:${projectId}`, payload);

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

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await worker.close();
  process.exit(0);
});

module.exports = worker;
