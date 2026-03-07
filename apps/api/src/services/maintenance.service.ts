import prisma from "../lib/prisma";
import { eventEmitter } from "../controllers/events.controller";

export class MaintenanceService {
  /**
   * Checks for devices that haven't sent a reading recently
   * A "Dead Man's Switch" mechanism
   */
  static async checkDeviceHealth() {
    console.log("[MaintenanceService] Running device health check...");

    const THRESHOLD_SECONDS = 30;
    const staleTime = new Date(Date.now() - THRESHOLD_SECONDS * 1000);

    try {
      // Find devices that were online but haven't been seen recently
      const staleDevices = await prisma.device.findMany({
        where: {
          status: "online",
          lastSeen: {
            lt: staleTime,
          },
        },
        include: {
          transformer: true,
        },
      });

      if (staleDevices.length === 0) return;

      console.log(`[MaintenanceService] Found ${staleDevices.length} stale devices. Marking offline...`);

      // Group stale devices by transformerId to handle alerts efficiently
      const transformerIds = [...new Set(staleDevices.map(d => d.transformerId))];

      for (const device of staleDevices) {
        await prisma.device.update({
          where: { id: device.id },
          data: { status: "offline" },
        });
      }

      for (const transformerId of transformerIds) {
        const existingAlert = await prisma.alert.findFirst({
          where: {
            transformerId,
            type: "COMMUNICATION_LOST",
            isResolved: false,
          },
        });

        if (!existingAlert) {
          const device = staleDevices.find(d => d.transformerId === transformerId);
          await prisma.alert.create({
            data: {
              transformerId,
              type: "COMMUNICATION_LOST",
              message: `COMMUNICATION LOST: Sensors at ${device?.transformer.location || 'Unknown'} have stopped reporting.`,
              severity: "CRITICAL",
            },
          });
          console.log(`[MaintenanceService] Created COMMUNICATION_LOST alert for transformer: ${transformerId}`);
        }
      }
    } catch (error) {
      console.error("[MaintenanceService] Health check failed:", error);
    }
  }
}
