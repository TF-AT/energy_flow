import { BaseAdapter } from "./base.adapter";
import { TelemetryEvent, DeviceType } from "../../types/telemetry.types";

export class MqttAdapter extends BaseAdapter {
  private interval: NodeJS.Timeout | null = null;
  private deviceType: DeviceType;

  constructor(deviceId: string, deviceType: DeviceType, onTelemetry: (event: TelemetryEvent) => void) {
    super(deviceId, onTelemetry);
    this.deviceType = deviceType;
  }

  async start(): Promise<void> {
    console.log(`[MqttAdapter] Subscribed to topic: energy/telemetry/${this.deviceId}`);
    
    // Simulate periodic MQTT publications
    this.interval = setInterval(() => {
      this.onTelemetry(this.normalize({ simulatedMqttPayload: true }));
    }, 5000 + Math.random() * 5000);
  }

  async stop(): Promise<void> {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    console.log(`[MqttAdapter] Unsubscribed from topic: energy/telemetry/${this.deviceId}`);
  }

  protected normalize(data: any): TelemetryEvent {
    // In a real MQTT adapter, data would be a Buffer from the broker
    const timestamp = Date.now();
    
    // Mock metrics based on device type
    let metrics: any = {};
    switch (this.deviceType) {
      case "transformer":
        metrics = { voltage: 230 + Math.random() * 5, frequency: 50 + Math.random() * 0.1, load: 45 + Math.random() * 20 };
        break;
      case "solar":
        metrics = { power_kw: 50 + Math.random() * 50, efficiency: 18 + Math.random() * 2, status: "active" };
        break;
      case "battery":
        metrics = { soc: 75 + Math.random() * 5, charge_rate: Math.random() * 5, temperature: 25 + Math.random() * 5 };
        break;
      case "load":
        metrics = { consumption: 150 + Math.random() * 50, peak_demand: 300, status: "normal" };
        break;
    }

    return {
      deviceId: this.deviceId,
      deviceType: this.deviceType,
      metrics,
      timestamp
    };
  }
}
