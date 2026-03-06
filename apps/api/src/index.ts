import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/error.middleware";
import { validateBody } from "./middleware/validate.middleware";
import * as microgridController from "./controllers/microgrid.controller";
import * as readingController from "./controllers/reading.controller";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health Check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Microgrid Routes
app.get("/microgrids", microgridController.getMicrogrids);
app.get("/transformers", microgridController.getTransformers);
app.get("/alerts", microgridController.getAlerts);
app.get("/api/dashboard", microgridController.getDashboardData);
app.get("/readings", readingController.getReadings);

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
});
