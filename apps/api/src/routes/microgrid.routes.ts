import { Router } from "express";
import * as microgridController from "../controllers/microgrid.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// All microgrid routes are protected
router.use(verifyToken);

router.get("/dashboard", microgridController.getDashboardData);
router.get("/microgrids", microgridController.getMicrogrids);
router.get("/transformers", microgridController.getTransformers);
router.get("/transformers/:id", microgridController.getTransformerById);
router.get("/alerts", microgridController.getAlerts);

export default router;
