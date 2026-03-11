import { eventEmitter } from "../controllers/events.controller";
import { MicrogridInstabilityEvent } from "../types/vpp.types";
import prisma from "../lib/prisma";

export class MicrogridBalancingService {
  /**
   * Monitor aggregate frequency/voltage and net load
   */
  static async checkMicrogridStability(microgridId: string) {
    try {
      // Find all transformers in this microgrid's sites
      const microgrid = await prisma.microgrid.findUnique({
        where: { id: microgridId },
        include: { nodes: { include: { site: { include: { transformers: true } } } } }
      });

      if (!microgrid) return;

      // In a real scenario, we'd aggregate frequency/voltage from transformers.
      // If voltage drops significantly, or load > generation + storage:
      // Emit instability event
      
      // Placeholder logic for MVP
      const isUnstable = false; // Add real logic based on telemetry

      if (isUnstable) {
        const evt: MicrogridInstabilityEvent = {
          microgridId,
          severity: "HIGH",
          recommendedAction: "DISCHARGE_STORAGE_IMMEDIATELY",
          timestamp: Date.now()
        };
        eventEmitter.emit("vpp:microgridInstability", evt);
        console.warn(`[MicrogridBalancingService] Instability detected in microgrid ${microgridId}`);
      }
    } catch (error) {
      console.error("[MicrogridBalancingService] Error checking stability:", error);
    }
  }
}
