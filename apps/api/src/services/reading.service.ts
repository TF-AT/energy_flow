import prisma from "../lib/prisma";
import { eventEmitter } from "../controllers/events.controller";
import { telemetryEvents } from "./telemetry.service";
import { TelemetryEvent, TransformerMetrics, SolarMetrics, BatteryMetrics, LoadMetrics } from "../types/telemetry.types";
import { AlertRuleService } from "./alert-rule.service";

export class ReadingService {
  private static buffers = {
    transformer: [] as any[],
    solar: [] as any[],
    battery: [] as any[],
    load: [] as any[],
  };

  private static BATCH_SIZE = 50;
  private static BATCH_INTERVAL = 2000;
  private static timeouts: Record<string, NodeJS.Timeout | null> = {
    transformer: null,
    solar: null,
    battery: null,
    load: null,
  };

  /**
   * Initializes listeners for the telemetry pipeline.
   */
  static init() {
    telemetryEvents.on("telemetry-for-db", (event: TelemetryEvent) => {
      this.handleIncomingTelemetry(event);
    });
    console.log("[ReadingService] Telemetry persistence listeners initialized.");
  }

  private static async handleIncomingTelemetry(event: TelemetryEvent) {
    const { deviceId, deviceType, metrics, timestamp } = event;
    const date = new Date(timestamp);

    // Buffer the reading
    this.buffers[deviceType].push({ ...metrics, deviceId, timestamp: date });

    // Check for batch flush
    if (this.buffers[deviceType].length >= this.BATCH_SIZE) {
      this.flush(deviceType);
    } else if (!this.timeouts[deviceType]) {
      this.timeouts[deviceType] = setTimeout(() => this.flush(deviceType), this.BATCH_INTERVAL);
    }

    // Find device for context
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { site: { select: { organizationId: true } } },
    });

    if (device) {
      // Update Device Status
      await prisma.device.update({
        where: { id: deviceId },
        data: { lastSeen: new Date(), status: "online" },
      });

      // Evaluate dynamic rules
      await AlertRuleService.evaluate(event, device.site.organizationId, deviceId);
    }
  }

  private static async flush(type: string) {
    const batch = [...this.buffers[type as keyof typeof this.buffers]];
    this.buffers[type as keyof typeof this.buffers] = [];
    
    if (this.timeouts[type]) {
      clearTimeout(this.timeouts[type]!);
      this.timeouts[type] = null;
    }

    if (batch.length === 0) return;

    try {
      switch (type) {
        case "transformer":
          await prisma.energyReading.createMany({
            data: batch.map(m => ({
              deviceId: m.deviceId,
              voltage: m.voltage,
              current: 0, // Mock current if not provided
              frequency: m.frequency,
              timestamp: m.timestamp,
            })),
          });
          break;
        case "solar":
          await prisma.solarReading.createMany({
            data: batch.map(m => ({
              solarGeneratorId: m.deviceId,
              power_kw: m.power_kw,
              efficiency: m.efficiency,
              status: m.status,
              timestamp: m.timestamp,
            })),
          });
          break;
        case "battery":
          await prisma.batteryReading.createMany({
            data: batch.map(m => ({
              batteryStorageId: m.deviceId,
              soc_percentage: m.soc,
              charge_rate_kw: m.charge_rate,
              temperature: m.temperature,
              timestamp: m.timestamp,
            })),
          });
          break;
        case "load":
          await prisma.loadReading.createMany({
            data: batch.map(m => ({
              energyLoadId: m.deviceId,
              consumption_kw: m.consumption,
              peak_demand_kw: m.peak_demand,
              status: m.status,
              timestamp: m.timestamp,
            })),
          });
          break;
      }
      
      // Notify SSE/Web for legacy support if needed
      batch.forEach(r => eventEmitter.emit("reading", r));
      
    } catch (error) {
      console.error(`[ReadingService] Failed to flush ${type} batch:`, error);
    }
  }
}
