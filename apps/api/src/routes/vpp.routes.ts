import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import * as vppController from "../controllers/vpp.controller";

const router = Router();

// Apply auth middleware to all vpp routes
router.use(verifyToken);

// Topology Routes
router.post("/microgrids", vppController.createMicrogrid);
router.get("/microgrids", vppController.getMicrogrids);

router.post("/nodes", vppController.createNode);
router.get("/nodes/:id", vppController.getNodeDetails);

// Settlement Routes
router.get("/microgrids/:microgridId/settlements", vppController.getSettlements);

export default router;
