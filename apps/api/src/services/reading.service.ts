import prisma from "../lib/prisma";
import { eventEmitter } from "../controllers/events.controller";

export interface CreateReadingDto {
  deviceId: string;
  voltage: number;
  current: number;
  frequency: number;
  timestamp: Date;
  idempotencyKey?: string;
}

export class ReadingService {
  static async processReading(data: CreateReadingDto) {
    const { deviceId, voltage, current, frequency, timestamp, idempotencyKey } = data;

    console.log(`[ReadingService] Processing reading from device: ${deviceId}`);

    // 1. Idempotency Check
    if (idempotencyKey) {
      const existing = await prisma.energyReading.findUnique({
        where: { idempotencyKey }
      });
      if (existing) {
        console.log(`[ReadingService] Duplicate idempotencyKey detected: ${idempotencyKey}`);
        return existing;
      }
    }

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { transformer: true },
    });

    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    // 2. Persist Reading and Update Device State
    const [reading] = await Promise.all([
      prisma.energyReading.create({
        data: {
          deviceId,
          voltage,
          current,
          frequency,
          timestamp,
          idempotencyKey,
        },
      }),
      prisma.device.update({
        where: { id: deviceId },
        data: {
          lastSeen: new Date(),
          status: "online",
        },
      }),
      // Resolve any communication lost alerts for this transformer
      prisma.alert.updateMany({
        where: {
          transformerId: device.transformerId,
          type: "COMMUNICATION_LOST",
          isResolved: false,
        },
        data: { isResolved: true },
      }),
    ]);

    // Notify SSE
    eventEmitter.emit("reading", reading);

    // 3. Alert Detection
    const alertsToCreate = [];
    const normalTypes = [];

    if (voltage > 250) {
      alertsToCreate.push({ type: "OverVoltage", message: `Critical OverVoltage: ${voltage}V detected on device ${deviceId}`, severity: "CRITICAL" });
    } else if (voltage < 180) {
      alertsToCreate.push({ type: "UnderVoltage", message: `Critical UnderVoltage: ${voltage}V detected on device ${deviceId}`, severity: "WARNING" });
    } else {
      normalTypes.push("OverVoltage", "UnderVoltage");
    }

    if (frequency > 51 || frequency < 49) {
      alertsToCreate.push({ type: "GridInstability", message: `Frequency anomaly: ${frequency}Hz detected on device ${deviceId}`, severity: "CRITICAL" });
    } else {
      normalTypes.push("GridInstability");
    }

    // Process Alerts
    for (const alertData of alertsToCreate) {
      const existingAlert = await prisma.alert.findFirst({
        where: {
          transformerId: device.transformerId,
          type: alertData.type,
          isResolved: false
        }
      });

      if (!existingAlert) {
        const alert = await prisma.alert.create({
          data: {
            transformerId: device.transformerId,
            type: alertData.type,
            message: alertData.message,
            severity: alertData.severity, // Add severity here
          },
        });

        // Notify SSE
        eventEmitter.emit("alert", alert);
      }
    }

    // Resolve fixed conditions
    if (normalTypes.length > 0) {
      await prisma.alert.updateMany({
        where: {
          transformerId: device.transformerId,
          type: { in: normalTypes },
          isResolved: false
        },
        data: { isResolved: true }
      });
    }

    console.log(`[ReadingService] Successfully processed reading for device ${deviceId}`);
    return reading;
  }
}
