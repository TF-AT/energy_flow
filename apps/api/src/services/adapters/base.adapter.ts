import { TelemetryEvent } from "../../types/telemetry.types";

export abstract class BaseAdapter {
  protected deviceId: string;
  protected onTelemetry: (event: TelemetryEvent) => void;

  constructor(deviceId: string, onTelemetry: (event: TelemetryEvent) => void) {
    this.deviceId = deviceId;
    this.onTelemetry = onTelemetry;
  }

  /**
   * Starts the adapter. For MQTT, this might mean subscribing to a topic.
   * For Modbus, it might mean starting a polling interval.
   */
  abstract start(): Promise<void>;

  /**
   * Stops the adapter and cleans up resources.
   */
  abstract stop(): Promise<void>;

  /**
   * Normalizes raw device data into a TelemetryEvent.
   */
  protected abstract normalize(data: any): TelemetryEvent;
}
