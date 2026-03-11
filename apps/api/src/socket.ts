import { Server as WebSocketServer } from "ws";
import { Server as HttpServer } from "http";
import { parse } from "url";
import { AuthService } from "./services/auth.service";
import { TelemetryService, telemetryEvents } from "./services/telemetry.service";
import { DeviceGateway } from "./services/gateway.service";
import { TelemetryEvent } from "./types/telemetry.types";

let wss: WebSocketServer;

export const initWebSocket = (server: HttpServer) => {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    try {
      if (!req.url) throw new Error("No URL provided");
      const { query } = parse(req.url, true);
      const token = query.token as string;
      
      if (!token) throw new Error("Token required for WebSocket connection");
      
      const user = AuthService.verifyToken(token) as any;
      (ws as any).organizationId = user.organizationId;
      
      console.log(`[WS] Client connected for org: ${user.organizationId}`);
    } catch (err: any) {
      console.error("[WS] Connection rejected: ", err.message);
      ws.close(1008, "Unauthorized");
      return;
    }
    
    ws.on("close", () => {
        console.log("[WS] Client disconnected");
    });
  });

  // Listen for validated telemetry events from the pipeline
  telemetryEvents.on("validated-telemetry", (event: TelemetryEvent) => {
    broadcast(event);
  });

  // --- VPP Real-Time Event Broadcasts ---
  const { eventEmitter } = require("./controllers/events.controller");

  eventEmitter.on("vpp:netPowerUpdated", (evt: any) => {
    broadcastVppEvent("vpp:netPowerUpdated", evt);
  });

  eventEmitter.on("vpp:tradeExecuted", (evt: any) => {
    broadcastVppEvent("vpp:tradeExecuted", evt);
  });

  console.log("[WS] WebSocket server initialized and linked to VPP events");
  
  // Start simulation loop (Simulates a hardware bridge like MQTT/Modbus)
  setInterval(simulateNetworkTraffic, 2000);
};

const broadcast = (data: any) => {
  if (!wss) return;
  const message = JSON.stringify({ type: "telemetry", data });
  wss.clients.forEach((client: any) => {
    if (client.readyState === 1 && client.organizationId === data.organizationId) { // 1 = OPEN
      client.send(message);
    }
  });
};

export const emitAlert = (alert: any) => {
  if (!wss) return;
  const message = JSON.stringify({ type: "alert", data: alert });
  wss.clients.forEach((client: any) => {
    if (client.readyState === 1 && client.organizationId === alert.organizationId) {
      client.send(message);
    }
  });
};

const broadcastVppEvent = (type: string, data: any) => {
  if (!wss) return;
  const message = JSON.stringify({ type, data });
  wss.clients.forEach((client: any) => {
    if (client.readyState === 1) { // 1 = OPEN
      // In MVP, we broadcast to all open nodes. In Prod, filter by organizationId
      client.send(message);
    }
  });
};

/**
 * Simulates incoming structured telemetry from various grid devices.
 * In the new architecture, most devices (MQTT/Modbus) handle their own loops.
 * This simulates a raw HTTP push for the Load Node.
 */
function simulateNetworkTraffic() {
  const timestamp = Date.now();

  // Load Telemetry via Webhook
  // Using the known load-node-01 device, will be automatically stamped with org by DeviceGateway if valid
  DeviceGateway.handleWebhookPush("load-node-01", {
    metrics: {
      consumption: Number((100 + Math.random() * 150).toFixed(2)),
      peak_demand: 300,
      status: "normal",
    },
    timestamp
  });
}
