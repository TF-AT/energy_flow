import { Router } from "express";
import authRoutes from "./auth.routes";
import microgridRoutes from "./microgrid.routes";
import readingRoutes from "./reading.routes";
import infrastructureRoutes from "./infrastructure.routes";
import analyticsRoutes from "./analytics.routes";
import alertRuleRoutes from "./alert-rule.routes";
import vppRoutes from "./vpp.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/", microgridRoutes);
router.use("/", readingRoutes);
router.use("/", infrastructureRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/alerts/rules", alertRuleRoutes);
router.use("/vpp", vppRoutes);

export default router;
