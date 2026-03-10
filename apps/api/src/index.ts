import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MaintenanceService } from "./services/maintenance.service";
import { ReadingService } from "./services/reading.service";
import { DeviceGateway } from "./services/gateway.service";
import { errorHandler } from "./middleware/error.middleware";
import * as eventsController from "./controllers/events.controller";
import apiRouter from "./routes";

import http from "http";
import { initWebSocket } from "./socket";

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3001;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Routes ---

// 1. Mission-Critical / System Endpoints (No Prefix)
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));
app.get("/events", eventsController.streamEvents);

// 2. Centralized API Router (Mounts everything under /api)
app.use("/api", apiRouter);

// --- Bootstrapping & Services ---
app.use(errorHandler);

const startServices = async () => {
    console.log("[App] Initializing background services...");
    // Initialize persistence listeners
    ReadingService.init();
    // Initialize Device Gateway (IoT layer)
    await DeviceGateway.init();
    // Dead-man switch check
    setInterval(() => MaintenanceService.checkDeviceHealth(), 15000);
};

server.listen(port, () => {
  console.log(`[HTTP] Microgrid API live on http://localhost:${port}`);
  initWebSocket(server);
  startServices();
});
