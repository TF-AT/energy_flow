import { Router } from "express";
import * as readingController from "../controllers/reading.controller";
import { validateBody } from "../middleware/validate.middleware";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// Device Ingestion (Unprotected)
router.post("/devices/register", validateBody(["id", "type", "transformerId"]), readingController.registerDevice);
router.post("/readings", validateBody(["deviceId", "voltage", "current", "frequency", "timestamp"]), readingController.createReading);

// Protected Reading History
router.get("/readings", verifyToken, readingController.getReadings);

export default router;
