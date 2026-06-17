const alertEmail = ({ projectName, errorMessage, count, threshold, url }) => ({
  subject: `🚨 BugRadar Alert — ${projectName} has ${count} errors`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:560px;margin:40px auto;padding:0 20px;">

        <!-- Header -->
        <div style="margin-bottom:32px;">
          <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:24px;">
            <div style="width:28px;height:28px;background:#6366f1;border-radius:8px;display:flex;align-items:center;justify-content:center;">
              <span style="color:white;font-size:14px;font-weight:bold;">B</span>
            </div>
            <span style="color:#fff;font-size:16px;font-weight:600;">BugRadar</span>
          </div>
        </div>

        <!-- Alert card -->
        <div style="background:#111;border:1px solid #1f1f1f;border-radius:16px;padding:28px;margin-bottom:24px;">

          <!-- Alert badge -->
          <div style="display:inline-flex;align-items:center;gap:6px;background:#ef44441a;border:1px solid #ef444433;border-radius:8px;padding:4px 12px;margin-bottom:20px;">
            <div style="width:6px;height:6px;background:#ef4444;border-radius:50%;"></div>
            <span style="color:#f87171;font-size:12px;font-weight:500;">
              ${threshold === 10 ? "Alert" : threshold === 50 ? "High Alert" : "Critical Alert"}
            </span>
          </div>

          <h1 style="color:#fff;font-size:20px;font-weight:600;margin:0 0 8px;">
            ${count} errors in ${projectName}
          </h1>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px;line-height:1.6;">
            An error has hit ${count} occurrences and needs your attention.
          </p>

          <!-- Error details -->
          <div style="background:#0a0a0a;border:1px solid #1f1f1f;border-radius:12px;padding:16px;margin-bottom:24px;">
            <p style="color:#6b7280;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">
              Error message
            </p>
            <p style="color:#f87171;font-size:13px;font-family:monospace;margin:0;word-break:break-all;line-height:1.5;">
              ${errorMessage}
            </p>
          </div>

          <!-- Stats -->
          <div style="display:flex;gap:24px;margin-bottom:24px;">
            <div>
              <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px;">Occurrences</p>
              <p style="color:#fff;font-size:24px;font-weight:600;margin:0;">${count}</p>
            </div>
            <div style="width:1px;background:#1f1f1f;"></div>
            <div>
              <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px;">Project</p>
              <p style="color:#fff;font-size:24px;font-weight:600;margin:0;">${projectName}</p>
            </div>
          </div>

          <!-- CTA -->
          <a href="${url}" style="display:block;background:#6366f1;color:#fff;text-align:center;padding:12px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:500;">
            View in BugRadar →
          </a>
        </div>

        <!-- Footer -->
        <p style="color:#374151;font-size:12px;text-align:center;margin:0;">
          You're receiving this because you have a BugRadar project.
        </p>
      </div>
    </body>
    </html>
  `,
});

module.exports = { alertEmail };
