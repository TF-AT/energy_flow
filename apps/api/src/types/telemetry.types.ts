export type DeviceType = "transformer" | "solar" | "battery" | "load";

export interface TransformerMetrics {
  voltage: number;
  frequency: number;
  load: number;
}

export interface SolarMetrics {
  power_kw: number;
  efficiency: number;
  status: string;
}

export interface BatteryMetrics {
  soc: number;
  charge_rate: number;
  temperature: number;
}

export interface LoadMetrics {
  consumption: number;
  peak_demand: number;
  status: string;
}

export type Metrics = TransformerMetrics | SolarMetrics | BatteryMetrics | LoadMetrics;

export interface TelemetryEvent {
  deviceId: string;
  deviceType: DeviceType;
  metrics: Metrics;
  timestamp: number;
  organizationId?: string; // Stamped by the gateway for multi-tenant isolation
}
