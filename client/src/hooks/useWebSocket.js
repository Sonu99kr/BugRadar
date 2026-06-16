import { useEffect, useRef } from "react";

export function useWebSocket(projectId, onMessage) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const mountedRef = useRef(true);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!projectId) return;

    mountedRef.current = true;

    const connect = () => {
      // Don't reconnect if already open or connecting
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      const ws = new WebSocket("ws://localhost:5020");
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log("[BugRadar WS] Connected");
        ws.send(JSON.stringify({ type: "subscribe", projectId }));
      };

      ws.onmessage = (e) => {
        if (!mountedRef.current) return;
        try {
          const message = JSON.parse(e.data);
          if (message.type === "new_error") {
            onMessageRef.current(message);
          }
        } catch (err) {
          console.error("[BugRadar WS] Parse error:", err);
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        console.log("[BugRadar WS] Disconnected — reconnecting in 3s");
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        // Error is logged by onclose — no need to log twice
      };
    };

    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional close
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [projectId]); // only reconnect if projectId changes
}
