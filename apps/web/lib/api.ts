import { DashboardData, Transformer, Alert, EnergyReading, SolarGenerator, BatteryStorage, EnergyLoad } from "./types";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetcher<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = Cookies.get("auth_token");
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      Cookies.remove("auth_token");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  login: async (credentials: any) => {
    const data = await fetcher<{ token: string, user: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    
    // Set cookie for 1 hour (as specified in requirements)
    Cookies.set("auth_token", data.token, { expires: 1/24 });
    return data;
  },
  getDashboardData: () => fetcher<DashboardData>("/api/dashboard"),
  getTransformers: () => fetcher<Transformer[]>("/api/transformers"),
  getAlerts: () => fetcher<Alert[]>("/api/alerts"),
  getReadings: (deviceId?: string, limit?: number) => 
    fetcher<EnergyReading[]>(`/api/readings?${deviceId ? `deviceId=${deviceId}` : ""}${limit ? `&limit=${limit}` : ""}`),
  getTransformerById: (id: string) => fetcher<Transformer>(`/api/transformers/${id}`),
  getSolarGenerators: () => fetcher<SolarGenerator[]>("/api/solar"),
  getSolarById: (id: string) => fetcher<SolarGenerator>(`/api/solar/${id}`),
  getBatteries: () => fetcher<BatteryStorage[]>("/api/batteries"),
  getBatteryById: (id: string) => fetcher<BatteryStorage>(`/api/batteries/${id}`),
  getLoads: () => fetcher<EnergyLoad[]>("/api/loads"),
  getLoadById: (id: string) => fetcher<EnergyLoad>(`/api/loads/${id}`),
  
  // Analytics
  getPowerAnalytics: (startTime?: string, endTime?: string, deviceId?: string) => 
    fetcher<any[]>(`/api/analytics/power-output?${startTime ? `startTime=${startTime}` : ""}${endTime ? `&endTime=${endTime}` : ""}${deviceId ? `&deviceId=${deviceId}` : ""}`),
  getLoadAnalytics: (startTime?: string, endTime?: string, deviceId?: string) => 
    fetcher<any[]>(`/api/analytics/load-consumption?${startTime ? `startTime=${startTime}` : ""}${endTime ? `&endTime=${endTime}` : ""}${deviceId ? `&deviceId=${deviceId}` : ""}`),
  getBatteryAnalytics: (startTime?: string, endTime?: string, deviceId?: string) => 
    fetcher<any[]>(`/api/analytics/batteries?${startTime ? `startTime=${startTime}` : ""}${endTime ? `&endTime=${endTime}` : ""}${deviceId ? `&deviceId=${deviceId}` : ""}`),
  getGridHealthAnalytics: (startTime?: string, endTime?: string) => 
    fetcher<any[]>(`/api/analytics/grid-health?${startTime ? `startTime=${startTime}` : ""}${endTime ? `&endTime=${endTime}` : ""}`),
    
  // Alert Rules
  getAlertRules: () => fetcher<any[]>("/api/alerts/rules"),
  createAlertRule: (data: any) => fetcher<any>("/api/alerts/rules", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateAlertRule: (id: string, data: any) => fetcher<any>(`/api/alerts/rules/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
};
