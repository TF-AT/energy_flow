import { EventEmitter } from "events";
import { TelemetryEvent, TransformerMetrics, SolarMetrics, BatteryMetrics, LoadMetrics } from "../types/telemetry.types";

export const telemetryEvents = new EventEmitter();

export class TelemetryService {
  /**
   * Ingests a new telemetry event, validates it, and notifies listeners.
   */
  static ingest(event: TelemetryEvent) {
    try {
      this.validate(event);
      
      // Emit for real-time WebSocket broadcasting
      telemetryEvents.emit("validated-telemetry", event);
      
      // Emit for persistence (ReadingService)
      telemetryEvents.emit("telemetry-for-db", event);
      
    } catch (error) {
      console.warn(`[TelemetryService] Rejected malformed telemetry from ${event.deviceId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static validate(event: TelemetryEvent) {
    if (!event.deviceId || !event.deviceType || !event.metrics || !event.timestamp) {
      throw new Error("Missing required telemetry fields");
    }

    const { metrics } = event;

    switch (event.deviceType) {
      case "transformer":
        const tm = metrics as TransformerMetrics;
        if (tm.voltage < 0 || tm.voltage > 500) throw new Error("Voltage out of bounds");
        if (tm.frequency < 45 || tm.frequency > 55) throw new Error("Frequency out of bounds");
        break;
      
      case "solar":
        const sm = metrics as SolarMetrics;
        if (sm.power_kw < 0 || sm.power_kw > 1000) throw new Error("Solar power out of bounds");
        if (sm.efficiency < 0 || sm.efficiency > 100) throw new Error("Solar efficiency out of bounds");
        break;

      case "battery":
        const bm = metrics as BatteryMetrics;
        if (bm.soc < 0 || bm.soc > 100) throw new Error("Battery SOC out of bounds");
        if (bm.temperature < -20 || bm.temperature > 80) throw new Error("Battery temperature critical");
        break;

      case "load":
        const lm = metrics as LoadMetrics;
        if (lm.consumption < 0) throw new Error("Negative load consumption");
        break;

      default:
        throw new Error(`Unknown device type: ${event.deviceType}`);
    }
  }
}
