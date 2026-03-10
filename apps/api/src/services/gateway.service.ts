import { BaseAdapter } from "./adapters/base.adapter";
import { MqttAdapter } from "./adapters/mqtt.adapter";
import { ModbusAdapter } from "./adapters/modbus.adapter";
import { WebhookAdapter } from "./adapters/webhook.adapter";
import { TelemetryService } from "./telemetry.service";
import { TelemetryEvent, DeviceType } from "../types/telemetry.types";
import prisma from "../lib/prisma";

export class DeviceGateway {
  private static activeAdapters: Map<string, BaseAdapter> = new Map();
  private static healthCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Initializes the gateway by loading devices from the registry (DB).
   */
  static async init() {
    console.log("[DeviceGateway] Initializing device registry...");
    
    // Self-seeding for MVP if DB is empty
    const deviceCount = await prisma.device.count();
    if (deviceCount === 0) {
      console.log("[DeviceGateway] DB empty, seeding MVP devices...");
      await this.seedMvpDevices();
    }

    const devices = await prisma.device.findMany({ include: { site: true } });
    
    for (const device of devices) {
      await this.activateDevice(device);
    }
    
    this.startHealthCheck();
    console.log(`[DeviceGateway] Successfully activated ${this.activeAdapters.size} device adapters.`);
  }

  private static async seedMvpDevices() {} // Not overriding existing seed logic here 

  /**
   * Activates a specific device based on its protocol.
   */
  private static async activateDevice(device: any) {
    if (this.activeAdapters.has(device.id)) return;

    let adapter: BaseAdapter;

    const onTelemetry = async (event: TelemetryEvent) => {
      // Stamp organizationId for multi-tenant isolation
      if (device.site?.organizationId) {
        event.organizationId = device.site.organizationId;
      }
      // Forward to TelemetryService
      TelemetryService.ingest(event);
      // Heartbeat: Update lastSeen in DB
      await this.updateDeviceStatus(device.id, "online");
    };

    switch (device.protocol) {
      case "MQTT":
        adapter = new MqttAdapter(device.id, device.type as DeviceType, onTelemetry);
        break;
      case "MODBUS":
        adapter = new ModbusAdapter(device.id, device.type as DeviceType, onTelemetry);
        break;
      case "WEBHOOK":
        adapter = new WebhookAdapter(device.id, device.type as DeviceType, onTelemetry);
        break;
      default:
        console.warn(`[DeviceGateway] No adapter found for protocol ${device.protocol} on device ${device.id}`);
        return;
    }

    await adapter.start();
    this.activeAdapters.set(device.id, adapter);
  }

  static handleWebhookPush(deviceId: string, payload: any) {
    const adapter = this.activeAdapters.get(deviceId);
    if (adapter instanceof WebhookAdapter) {
      adapter.receivePush(payload);
    } else {
      console.warn(`[DeviceGateway] Received push for ${deviceId} but adapter is not WEBHOOK or not active.`);
    }
  }

  private static startHealthCheck() {
    if (this.healthCheckInterval) return;
    this.healthCheckInterval = setInterval(async () => {
      const thirtySecondsAgo = new Date(Date.now() - 30000);
      
      // Mark as offline if no reading in 30s
      await prisma.device.updateMany({
        where: {
          lastSeen: { lt: thirtySecondsAgo },
          status: "online"
        },
        data: { status: "offline" }
      });
    }, 15000);
  }

  private static async updateDeviceStatus(deviceId: string, status: string) {
    try {
      await prisma.device.update({
        where: { id: deviceId },
        data: { 
          status,
          lastSeen: new Date()
        }
      });
    } catch (error) {
       // Silent fail
    }
  }

  static async shutdown() {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    for (const [id, adapter] of this.activeAdapters) {
      await adapter.stop();
    }
    this.activeAdapters.clear();
  }
}
