export interface Site {
  id: string;
  name: string;
  location: string;
  capacity_kw: number;
  transformers?: Transformer[];
  solarGenerators?: SolarGenerator[];
  batteries?: BatteryStorage[];
  loads?: EnergyLoad[];
}

export interface Transformer {
  id: string;
  location: string;
  capacity_kw: number;
  siteId: string;
  devices?: Device[];
  alerts?: Alert[];
}

export interface Device {
  id: string;
  type: string;
  status: "online" | "offline";
  lastSeen: string | Date;
  transformerId: string;
  readings?: EnergyReading[];
}

export interface EnergyReading {
  id: string;
  deviceId: string;
  voltage: number;
  current: number;
  frequency: number;
  timestamp: string | Date;
}

export interface SolarGenerator {
  id: string;
  name: string;
  location: string;
  siteId: string;
  readings?: SolarReading[];
}

export interface SolarReading {
  id: string;
  solarGeneratorId: string;
  power_kw: number;
  efficiency: number;
  status: string;
  timestamp: string | Date;
}

export interface BatteryStorage {
  id: string;
  name: string;
  location: string;
  siteId: string;
  readings?: BatteryReading[];
}

export interface BatteryReading {
  id: string;
  batteryStorageId: string;
  soc_percentage: number;
  charge_rate_kw: number;
  temperature: number;
  timestamp: string | Date;
}

export interface EnergyLoad {
  id: string;
  name: string;
  location: string;
  siteId: string;
  readings?: LoadReading[];
}

export interface LoadReading {
  id: string;
  energyLoadId: string;
  consumption_kw: number;
  peak_demand_kw: number;
  status: string;
  timestamp: string | Date;
}

export interface Alert {
  id: string;
  transformerId: string;
  type: string;
  message: string;
  severity: string;
  isResolved: boolean;
  createdAt: string;
  transformer?: Transformer;
}

export interface DashboardData {
  transformersCount: number;
  activeAlertsCount: number;
  recentAlerts: Alert[];
  recentEvents: Alert[];
  recentReadings: EnergyReading[];
}

export interface TelemetryData {
  transformers: any[];
  solar: any[];
  batteries: any[];
  loads: any[];
}
