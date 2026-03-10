import { DashboardData, Transformer, Alert, EnergyReading, SolarGenerator, BatteryStorage, EnergyLoad } from "./types";
import Cookies from "js-cookie";
import { z } from "zod";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetcher<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  retries = 3, 
  backoff = 500,
  schema?: z.ZodType<T>
): Promise<T> {
  const token = Cookies.get("auth_token");
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
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
        throw new Error("Unauthorized");
      }
      
      // Retry on 5xx errors or Rate Limits
      if ((response.status >= 500 || response.status === 429) && retries > 0) {
        console.warn(`[API] Fetch failed with ${response.status}. Retrying in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetcher(endpoint, options, retries - 1, backoff * 2, schema);
      }

      let errMessage = response.statusText;
      try {
        const errJson: any = await response.json();
        if (errJson && errJson.error) errMessage = errJson.error;
      } catch (e) {}

      throw new Error(`API error: ${errMessage}`);
    }
    
    // Success implies we are online
    if (typeof window !== "undefined") window.dispatchEvent(new Event("network-online"));
    
    const parsed = await response.json();
    let result = parsed;
    
    if (parsed && typeof parsed === "object" && parsed.status === "success" && "data" in parsed) {
      result = parsed.data;
    }
    
    if (schema) {
      try {
        result = schema.parse(result);
      } catch (e) {
        console.warn(`[Zod Validation] Mismatch on ${endpoint}:`, e);
      }
    }
    
    return result as T;
  } catch (error: any) {
    if (error.message !== "Unauthorized" && retries > 0 && !(error.message || "").startsWith("API error")) {
      console.warn(`[API] Network error: ${error.message}. Retrying in ${backoff}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetcher(endpoint, options, retries - 1, backoff * 2, schema);
    }
    
    // Exhausted retries
    if (typeof window !== "undefined") window.dispatchEvent(new Event("network-offline"));
    throw error;
  }
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
  getTransformers: () => fetcher<Transformer[]>("/api/transformers", {}, 3, 500, z.array(z.any())),
  getAlerts: () => fetcher<Alert[]>("/api/alerts", {}, 3, 500, z.array(z.any())),
  getReadings: (deviceId?: string, limit?: number) => 
    fetcher<EnergyReading[]>(`/api/readings?${deviceId ? `deviceId=${deviceId}` : ""}${limit ? `&limit=${limit}` : ""}`, {}, 3, 500, z.array(z.any())),
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
