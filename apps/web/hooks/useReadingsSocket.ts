import { useEffect, useState, useCallback } from "react";
import { Alert } from "../lib/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";

export interface TelemetryData {
  transformers: any[];
  solar: any[];
  batteries: any[];
  loads: any[];
}

export function useReadingsSocket() {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    transformers: [],
    solar: [],
    batteries: [],
    loads: [],
  });
  const [newAlerts, setNewAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socket: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

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
          
          if (payload.type === "telemetry") {
            const eventData = payload.data; // This is an individual TelemetryEvent
            const categoryMap: Record<string, keyof TelemetryData> = {
              transformer: "transformers",
              solar: "solar",
              battery: "batteries",
              load: "loads"
            };

            const category = categoryMap[eventData.deviceType];
            if (category) {
              setTelemetry((prev) => {
                const updatedCategory = [...prev[category]];
                const index = updatedCategory.findIndex(d => d.deviceId === eventData.deviceId || d.id === eventData.deviceId);
                
                // Flatten metrics into the object for backward compatibility with components
                const flattenedReading = {
                  ...eventData.metrics,
                  deviceId: eventData.deviceId,
                  timestamp: eventData.timestamp
                };

                if (index !== -1) {
                  updatedCategory[index] = flattenedReading;
                } else {
                  updatedCategory.push(flattenedReading);
                }

                return { ...prev, [category]: updatedCategory };
              });
            }
          } else if (payload.type === "alert") {
            setNewAlerts((prev) => [payload.data, ...prev]);
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
    };
  }, []);

  const clearAlerts = useCallback(() => {
    setNewAlerts([]);
  }, []);

  return { telemetry, newAlerts, isConnected, clearAlerts };
}
