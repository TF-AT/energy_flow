import { Request, Response } from "express";
import { eventEmitter } from "./events.controller";
import { TelemetryBatchEventSchema } from "@energy/event-schema";

export const handleTelemetryBatch = async (req: Request, res: Response) => {
  try {
    // 1. Zod runtime validation of the incoming batch
    const batch = TelemetryBatchEventSchema.parse(req.body);

    // 2. Aggregate Net Power per Node from the batch
    const nodeStats = new Map<string, { gen: number; con: number }>();

    batch.generation.forEach(gen => {
      const current = nodeStats.get(gen.nodeId) || { gen: 0, con: 0 };
      nodeStats.set(gen.nodeId, { ...current, gen: current.gen + gen.kwProduced });
    });

    batch.consumption.forEach(con => {
      const current = nodeStats.get(con.nodeId) || { gen: 0, con: 0 };
      nodeStats.set(con.nodeId, { ...current, con: current.con + con.kwConsumed });
    });

    // 3. Emit processed events for the routing engine
    nodeStats.forEach((stats, nodeId) => {
      const isSurplus = netPowerKw > 0;

      eventEmitter.emit("vpp:netPowerUpdated", {
        nodeId,
        microgridId: batch.microgridId,
        timestamp: Date.now(),
        netPowerKw: Math.abs(netPowerKw),
        isSurplus
      });
    });

    res.status(202).json({
      success: true,
      message: `Batch ${batch.batchId} processed. Balanced ${nodeStats.size} nodes.`
    });

  } catch (error: any) {
    console.error("[TelemetryBatchController] Invalid batch received:", error.issues || error.message);
    res.status(400).json({
      success: false,
      error: "Invalid telemetry batch payload",
      details: error.issues
    });
  }
};
