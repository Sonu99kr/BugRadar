const { Worker } = require("bullmq");
const transporter = require("../config/mailer");
const { alertEmail } = require("../utils/emailTemplates");
const pool = require("../config/db");
const { connection } = require("../config/queue");

const worker = new Worker(
  "error-alerts",
  async (job) => {
    const {
      to,
      projectName,
      errorMessage,
      count,
      threshold,
      projectId,
      groupId,
    } = job.data;

    const dashboardUrl = `http://localhost:5173/projects/${projectId}`;

    const { subject, html } = alertEmail({
      projectName,
      errorMessage,
      count,
      threshold,
      url: dashboardUrl,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log(
      `✉️ Alert sent to ${to} for project ${projectName} (${count} errors)`,
    );
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(`✓ Alert job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`✗ Alert job ${job.id} failed:`, err.message);
});

module.exports = worker;
