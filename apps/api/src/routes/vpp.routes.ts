import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import * as vppController from "../controllers/vpp.controller";
import { handleTelemetryBatch } from "../controllers/telemetry-batch.controller";

const router = Router();

// Apply auth middleware to all vpp routes
router.use(verifyToken);

// Topology Routes
router.post("/microgrids", vppController.createMicrogrid);
router.get("/microgrids", vppController.getMicrogrids);

router.post("/nodes", vppController.createNode);
router.get("/nodes/:id", vppController.getNodeDetails);

router.get("/microgrids/:microgridId/settlements", vppController.getSettlements);

// Telemetry Ingestion (Simulator)
router.post("/telemetry/batch", handleTelemetryBatch);

export default router;
