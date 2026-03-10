import { Router } from "express";
import * as microgridController from "../controllers/microgrid.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// All microgrid routes are protected
router.get("/dashboard", verifyToken, microgridController.getDashboardData);
router.get("/microgrids", verifyToken, microgridController.getMicrogrids);
router.get("/transformers", verifyToken, microgridController.getTransformers);
router.get("/transformers/:id", verifyToken, microgridController.getTransformerById);
router.get("/alerts", verifyToken, microgridController.getAlerts);

export default router;
