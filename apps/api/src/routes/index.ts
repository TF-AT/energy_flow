import { Router } from "express";
import authRoutes from "./auth.routes";
import microgridRoutes from "./microgrid.routes";
import readingRoutes from "./reading.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/", microgridRoutes);
router.use("/", readingRoutes);

export default router;
