import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// Analytics routes are protected
router.use(verifyToken);

router.get("/power-output", analyticsController.getPowerOutputAnalytics);
router.get("/load-consumption", analyticsController.getLoadConsumptionAnalytics);
router.get("/batteries", analyticsController.getBatteryAnalytics);
router.get("/grid-health", analyticsController.getGridHealthAnalytics);

export default router;
