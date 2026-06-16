import { useEffect, useRef, useCallback } from "react";

export function useWebSocket(projectId, onMessage) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!projectId || !mountedRef.current) return;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket("ws://localhost:5020");
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      console.log("[BugRadar WS] Connected");

      // Subscribe to this project's channel
      ws.send(
        JSON.stringify({
          type: "subscribe",
          projectId,
        }),
      );
    };

    ws.onmessage = (e) => {
      if (!mountedRef.current) return;
      try {
        const message = JSON.parse(e.data);
        if (message.type === "new_error") {
          onMessage(message);
        }
      } catch (err) {
        console.error("[BugRadar WS] Parse error:", err);
      }
    };

    ws.onclose = (e) => {
      if (!mountedRef.current) return;
      console.log("[BugRadar WS] Disconnected — reconnecting in 3s");

      // Auto reconnect after 3 seconds
      reconnectTimer.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error("[BugRadar WS] Error:", err);
    };
  }, [projectId, onMessage]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      // Cleanup on unmount
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);
}
