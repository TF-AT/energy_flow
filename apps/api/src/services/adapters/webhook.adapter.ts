import { BaseAdapter } from "./base.adapter";
import { TelemetryEvent, DeviceType } from "../../types/telemetry.types";

export class WebhookAdapter extends BaseAdapter {
  private deviceType: DeviceType;

  constructor(deviceId: string, deviceType: DeviceType, onTelemetry: (event: TelemetryEvent) => void) {
    super(deviceId, onTelemetry);
    this.deviceType = deviceType;
  }

  async start(): Promise<void> {
    console.log(`[WebhookAdapter] Device ${this.deviceId} is now authorized for HTTP pushes`);
  }

  async stop(): Promise<void> {
    console.log(`[WebhookAdapter] Device ${this.deviceId} push authorization revoked`);
  }

  /**
   * Called by the DeviceGateway when an HTTP POST arrives.
   */
  public receivePush(payload: any) {
    this.onTelemetry(this.normalize(payload));
  }

  protected normalize(data: any): TelemetryEvent {
    // Normalizes whatever format the external device pushes
    return {
      deviceId: this.deviceId,
      deviceType: this.deviceType,
      metrics: data.metrics || data,
      timestamp: data.timestamp || Date.now()
    };
  }
}
