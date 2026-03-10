import { Router } from "express";
import * as alertRuleController from "../controllers/alert-rule.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// Protect all routes
router.use(verifyToken);

router.get("/", alertRuleController.getAlertRules);
router.post("/", alertRuleController.createAlertRule);
router.put("/:id", alertRuleController.updateAlertRule);
router.delete("/:id", alertRuleController.deleteAlertRule);

export default router;
