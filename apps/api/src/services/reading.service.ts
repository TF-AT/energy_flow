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
  private static buffer: CreateReadingDto[] = [];
  private static batchTimeout: NodeJS.Timeout | null = null;
  private static BATCH_SIZE = 50;
  private static BATCH_INTERVAL = 1000; // 1 second

  static async processReading(data: CreateReadingDto) {
    const { deviceId, voltage, current, frequency, timestamp, idempotencyKey } = data;

    console.log(`[ReadingService] Buffering reading from device: ${deviceId}`);

    // Add to buffer
    this.buffer.push(data);

    // If buffer reaches limit, flush immediately
    if (this.buffer.length >= this.BATCH_SIZE) {
      this.flushBuffer();
    } else if (!this.batchTimeout) {
      // Otherwise set a timeout to flush
      this.batchTimeout = setTimeout(() => this.flushBuffer(), this.BATCH_INTERVAL);
    }

    // For MVP consistency, we still perform individual device updates and alert checks 
    // synchronously to ensure real-time UI response, but the "Big Write" is batched.
    
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { transformer: true },
    });

    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    // Update Device State (Single row update - fast)
    await Promise.all([
      prisma.device.update({
        where: { id: deviceId },
        data: {
          lastSeen: new Date(),
          status: "online",
        },
      }),
      prisma.alert.updateMany({
        where: {
          transformerId: device.transformerId,
          type: "COMMUNICATION_LOST",
          isResolved: false,
        },
        data: { isResolved: true },
      }),
    ]);

    // SSE notification happens after flush for the reading itself
    // but alert detection happens now
    
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
            severity: alertData.severity,
          },
        });

        eventEmitter.emit("alert", alert);
      }
    }

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

    return { buffered: true };
  }

  private static async flushBuffer() {
    if (this.buffer.length === 0) return;

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    const currentBatch = [...this.buffer];
    this.buffer = [];

    console.log(`[ReadingService] Flushing batch of ${currentBatch.length} readings`);

    try {
      // Use createMany for high-frequency write optimization
      await prisma.energyReading.createMany({
        data: currentBatch.map(r => ({
          deviceId: r.deviceId,
          voltage: r.voltage,
          current: r.current,
          frequency: r.frequency,
          timestamp: r.timestamp,
          idempotencyKey: r.idempotencyKey,
        })),
      });

      // Notify SSE for all readings in batch
      for (const reading of currentBatch) {
        eventEmitter.emit("reading", reading);
      }
    } catch (error) {
      console.error("[ReadingService] Failed to flush batch:", error);
    }
  }
}
