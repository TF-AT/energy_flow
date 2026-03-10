import prisma from "../lib/prisma";
import { eventEmitter } from "../controllers/events.controller";
import { emitAlert } from "../socket";

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
          site: true,
        },
      });

      if (staleDevices.length === 0) return;

      console.log(`[MaintenanceService] Found ${staleDevices.length} stale devices. Marking offline...`);

      for (const device of staleDevices) {
        await prisma.device.update({
          where: { id: device.id },
          data: { status: "offline" },
        });

        const existingAlert = await prisma.alert.findFirst({
          where: {
            deviceId: device.id,
            type: "COMMUNICATION_LOST",
            isResolved: false,
          },
        });

        if (!existingAlert) {
          const alertData = {
            deviceId: device.id,
            type: "COMMUNICATION_LOST",
            message: `COMMUNICATION LOST: Device at ${device.site?.name || 'Unknown'} has stopped reporting.`,
            severity: "CRITICAL",
          };
          
          await prisma.alert.create({
            data: alertData,
          });

          emitAlert(alertData);
          console.log(`[MaintenanceService] Created COMMUNICATION_LOST alert for device: ${device.id}`);
        }
      }
    } catch (error) {
      console.error("[MaintenanceService] Health check failed:", error);
    }
  }
}
