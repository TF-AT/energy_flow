import { DashboardData, Transformer, Alert, EnergyReading } from "./types";
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
  getTransformers: () => fetcher<Transformer[]>("/transformers"),
  getAlerts: () => fetcher<Alert[]>("/alerts"),
  getReadings: (deviceId?: string, limit?: number) => 
    fetcher<EnergyReading[]>(`/readings?${deviceId ? `deviceId=${deviceId}` : ""}${limit ? `&limit=${limit}` : ""}`),
  getTransformerById: (id: string) => fetcher<Transformer>(`/transformers/${id}`),
};
