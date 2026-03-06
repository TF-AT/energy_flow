export interface Microgrid {
  id: string;
  name: string;
  location: string;
  capacity_kw: number;
  transformers?: Transformer[];
}

export interface Transformer {
  id: string;
  location: string;
  capacity_kw: number;
  microgridId: string;
  devices?: Device[];
  alerts?: Alert[];
}

export interface Device {
  id: string;
  type: string;
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

export interface Alert {
  id: string;
  transformerId: string;
  type: string;
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  isResolved: boolean;
  createdAt: string | Date;
  transformer?: Transformer;
}

export interface DashboardData {
  transformersCount: number;
  activeAlertsCount: number;
  recentAlerts: Alert[];
  recentReadings: EnergyReading[];
}
