import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MaintenanceService } from "./services/maintenance.service";
import { errorHandler } from "./middleware/error.middleware";
import { validateBody } from "./middleware/validate.middleware";
import * as readingController from "./controllers/reading.controller";
import * as eventsController from "./controllers/events.controller";
import * as microgridController from "./controllers/microgrid.controller";
import * as authController from "./controllers/auth.controller";
import { verifyToken } from "./middleware/auth.middleware";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health Check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Auth Routes
app.post("/api/auth/login", authController.login);

// Real-time Events
app.get("/events", eventsController.streamEvents);

// Protected Microgrid Routes
app.use("/microgrids", verifyToken);
app.get("/microgrids", microgridController.getMicrogrids);

app.use("/transformers", verifyToken);
app.get("/transformers", microgridController.getTransformers);

app.use("/alerts", verifyToken);
app.get("/alerts", microgridController.getAlerts);

app.get("/api/dashboard", verifyToken, microgridController.getDashboardData);
app.get("/readings", verifyToken, readingController.getReadings);

// Device & Reading Routes
app.post(
  "/devices/register",
  validateBody(["id", "type", "transformerId"]),
  readingController.registerDevice
);

app.post(
  "/readings",
  validateBody(["deviceId", "voltage", "current", "frequency", "timestamp"]),
  readingController.createReading
);

// Global Error Handler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
  
  // Start background maintenance tasks
  setInterval(() => {
    MaintenanceService.checkDeviceHealth();
  }, 15000); // Check every 15 seconds
});
