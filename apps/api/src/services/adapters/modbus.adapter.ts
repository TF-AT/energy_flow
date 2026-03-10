import { BaseAdapter } from "./base.adapter";
import { TelemetryEvent, DeviceType } from "../../types/telemetry.types";

export class ModbusAdapter extends BaseAdapter {
  private pollInterval: NodeJS.Timeout | null = null;
  private deviceType: DeviceType;

  constructor(deviceId: string, deviceType: DeviceType, onTelemetry: (event: TelemetryEvent) => void) {
    super(deviceId, onTelemetry);
    this.deviceType = deviceType;
  }

  async start(): Promise<void> {
    console.log(`[ModbusAdapter] Initializing Modbus TCP session with device ${this.deviceId}`);
    
    // Simulate polling Modbus registers every 5 seconds
    this.pollInterval = setInterval(() => {
      this.onTelemetry(this.normalize({ registers: [40001, 40002, 40003] }));
    }, 5000);
  }

  async stop(): Promise<void> {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    console.log(`[ModbusAdapter] Closed Modbus TCP session with device ${this.deviceId}`);
  }

  protected normalize(data: any): TelemetryEvent {
    // In a real Modbus adapter, we would read specific registers based on a register map
    const timestamp = Date.now();
    
    let metrics: any = {};
    switch (this.deviceType) {
      case "transformer":
        metrics = { voltage: 228 + Math.random() * 4, frequency: 50.01, load: 50 + Math.random() * 10 };
        break;
      case "solar":
        metrics = { power_kw: 80, efficiency: 20, status: "active" };
        break;
      case "battery":
        metrics = { soc: 90, charge_rate: -2, temperature: 30 };
        break;
      case "load":
        metrics = { consumption: 200, peak_demand: 350, status: "normal" };
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
