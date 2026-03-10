import { Router } from "express";
import * as infrastructureController from "../controllers/infrastructure.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// Public Webhook Ingestion Point (In a real system, this would use API Key auth)
router.post("/ingest/:deviceId", infrastructureController.handleDevicePush);

// Infrastructure routes are protected
router.get("/solar", verifyToken, infrastructureController.getSolarGenerators);
router.get("/solar/:id", verifyToken, infrastructureController.getSolarGeneratorById);

router.get("/batteries", verifyToken, infrastructureController.getBatteries);
router.get("/batteries/:id", verifyToken, infrastructureController.getBatteryById);

router.get("/loads", verifyToken, infrastructureController.getLoads);
router.get("/loads/:id", verifyToken, infrastructureController.getLoadById);

export default router;
