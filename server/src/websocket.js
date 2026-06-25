const { WebSocketServer } = require("ws");
const { createClient } = require("redis");

const projectClients = new Map();

async function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });

  const subscriber = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });

  await subscriber.connect();

  console.log("WebSocket server ready");

  // Handle new client connections
  wss.on("connection", (ws, req) => {
    let subscribedProjectId = null;

    // Client sends { type: 'subscribe', projectId: '...' }
    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "subscribe" && message.projectId) {
          subscribedProjectId = message.projectId;

          // Add client to the project's set
          if (!projectClients.has(subscribedProjectId)) {
            projectClients.set(subscribedProjectId, new Set());

            // Subscribe to Redis channel for this project
            // Only subscribe once per project — not per client
            await subscriber.subscribe(
              `project:${subscribedProjectId}`,
              (payload) => {
                // Forward to all clients watching this project
                const clients = projectClients.get(subscribedProjectId);
                if (clients) {
                  clients.forEach((client) => {
                    if (client.readyState === 1) {
                      // 1 = OPEN
                      client.send(payload);
                    }
                  });
                }
              },
            );
          }

          projectClients.get(subscribedProjectId).add(ws);

          // Confirm subscription
          ws.send(
            JSON.stringify({
              type: "subscribed",
              projectId: subscribedProjectId,
            }),
          );
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    });

    // Clean up on disconnect
    ws.on("close", async () => {
      if (subscribedProjectId) {
        const clients = projectClients.get(subscribedProjectId);
        if (clients) {
          clients.delete(ws);

          // If no more clients watching this project
          // unsubscribe from Redis channel to save resources
          if (clients.size === 0) {
            projectClients.delete(subscribedProjectId);
            await subscriber.unsubscribe(`project:${subscribedProjectId}`);
          }
        }
      }
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err);
    });
  });
}

module.exports = { setupWebSocket };
