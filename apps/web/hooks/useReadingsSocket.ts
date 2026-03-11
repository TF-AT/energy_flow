import { useEffect, useRef } from "react";
import { Alert } from "../lib/types";
import { useTelemetryStore } from "../store/telemetryStore";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";

export function useReadingsSocket() {
  const processBatchedTelemetry = useTelemetryStore(state => state.processBatchedTelemetry);
  const processBatchedAlerts = useTelemetryStore(state => state.processBatchedAlerts);
  const setIsConnected = useTelemetryStore(state => state.setIsConnected);
  const clearAlerts = useTelemetryStore(state => state.clearAlerts);

  const telemetryBuffer = useRef<any[]>([]);
  const alertsBuffer = useRef<Alert[]>([]);

  useEffect(() => {
    let socket: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;
    
    // Batch processing interval
    const flushInterval = setInterval(() => {
      // Flush telemetry buffer
      if (telemetryBuffer.current.length > 0) {
        processBatchedTelemetry([...telemetryBuffer.current]);
        telemetryBuffer.current = []; // Clear current buffer
      }

      // Flush alerts buffer
      if (alertsBuffer.current.length > 0) {
        processBatchedAlerts([...alertsBuffer.current]);
        alertsBuffer.current = [];
      }
    }, 1000); // 1 second batching interval

    const connect = () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.warn("[WS] No token found, postponing connection.");
        reconnectTimeout = setTimeout(connect, 5000);
        return;
      }

      socket = new WebSocket(`${WS_URL}?token=${token}`);

      socket.onopen = () => {
        console.log("[WS] Connected to telemetry stream");
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          // Push to buffers instead of triggering React state updates directly
          if (payload.type === "telemetry") {
            telemetryBuffer.current.push(payload.data);
          } else if (payload.type === "alert") {
            alertsBuffer.current.push(payload.data);
          } else if (payload.type === "vpp:netPowerUpdated") {
            import("../store/vppStore").then(m => m.useVppStore.getState().updateNodeState(payload.data));
          } else if (payload.type === "vpp:tradeExecuted") {
            import("../store/vppStore").then(m => m.useVppStore.getState().addTrade(payload.data));
          }
        } catch (error) {
          console.error("[WS] Failed to parse message:", error);
        }
      };

      socket.onclose = () => {
        console.log("[WS] Disconnected, retrying in 5s...");
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 5000);
      };

      socket.onerror = (error) => {
        console.error("[WS] Socket error:", error);
        socket.close();
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimeout);
      clearInterval(flushInterval);
    };
  }, [processBatchedTelemetry, processBatchedAlerts, setIsConnected]);

  return { clearAlerts };
}
