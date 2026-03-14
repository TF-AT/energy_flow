/**
 * Energy Engine proxy routes — forwards simulation & optimization
 * requests from the frontend through to the Python energy engine.
 *
 * This keeps the Python engine internal; the frontend always talks to Node.
 */

import { Router, Request, Response } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import { energyEngine } from "../lib/energy-engine.client";

const router = Router();
router.use(verifyToken);

/**
 * GET /api/engine/health
 * Let the frontend know if the Python engine is healthy.
 */
router.get("/health", async (_req: Request, res: Response) => {
  const healthy = await energyEngine.isHealthy();
  res.json({ engine_available: healthy });
});

/**
 * POST /api/engine/simulate/tick
 * Run a grid simulation tick via the Python engine.
 */
router.post("/simulate/tick", async (req: Request, res: Response) => {
  try {
    const { microgridId, nodes } = req.body;
    const result = await energyEngine.simulateGridTick(microgridId, nodes);
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ error: "Energy engine unavailable", detail: err.message });
  }
});

/**
 * POST /api/engine/simulate/daily-profile
 * Generate a 24-hour energy profile for a node.
 */
router.post("/simulate/daily-profile", async (req: Request, res: Response) => {
  try {
    const { nodeId, baseLoadKw, solarCapacityKw, resolutionMinutes } = req.body;
    const result = await energyEngine.getDailyProfile(
      nodeId,
      baseLoadKw,
      solarCapacityKw,
      resolutionMinutes
    );
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ error: "Energy engine unavailable", detail: err.message });
  }
});

/**
 * POST /api/engine/optimize/p2p-trade
 * Solve P2P energy trading via CVXPY Linear Program.
 */
router.post("/optimize/p2p-trade", async (req: Request, res: Response) => {
  try {
    const { microgridId, nodes } = req.body;
    const result = await energyEngine.optimizeP2PTrades(microgridId, nodes);
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ error: "Energy engine unavailable", detail: err.message });
  }
});

/**
 * POST /api/engine/optimize/battery-schedule
 * Simulate battery charge/discharge schedule.
 */
router.post("/optimize/battery-schedule", async (req: Request, res: Response) => {
  try {
    const result = await energyEngine.scheduleBattery(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ error: "Energy engine unavailable", detail: err.message });
  }
});

export default router;
