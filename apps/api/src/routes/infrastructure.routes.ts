import { Router } from "express";
import * as infrastructureController from "../controllers/infrastructure.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// Public Webhook Ingestion Point (In a real system, this would use API Key auth)
router.post("/ingest/:deviceId", infrastructureController.handleDevicePush);

// Infrastructure routes are protected
router.use(verifyToken);

router.get("/solar", infrastructureController.getSolarGenerators);
router.get("/solar/:id", infrastructureController.getSolarGeneratorById);

router.get("/batteries", infrastructureController.getBatteries);
router.get("/batteries/:id", infrastructureController.getBatteryById);

router.get("/loads", infrastructureController.getLoads);
router.get("/loads/:id", infrastructureController.getLoadById);

export default router;
