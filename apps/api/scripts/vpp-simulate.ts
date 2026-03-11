import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL || "http://localhost:3001";
let authToken: string | null = null;
let microgridId: string | null = null;

const nodes = [
  { id: "vpp-solar-farm-1", type: "GRID_CONNECTION", name: "Community Solar Farm" },
  { id: "vpp-house-1", type: "HOUSE", name: "House 1 (Producer)" },
  { id: "vpp-house-2", type: "HOUSE", name: "House 2 (Consumer)" },
  { id: "vpp-house-3", type: "HOUSE", name: "House 3 (Consumer)" },
];

async function login() {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: "admin@energyflow.com",
      password: "password123",
    });
    authToken = response.data.token;
    console.log("[VPP-SIM] Authenticated successfully.");
  } catch (error: any) {
    console.error("[VPP-SIM] Auth failed:", error.message);
    process.exit(1);
  }
}

async function setupVppTopology() {
  console.log("[VPP-SIM] Setting up VPP Topology...");
  
  // 1. Create Microgrid
  try {
    const mgRes = await axios.post(`${API_URL}/api/vpp/microgrids`, {
      name: "Demo VPP Microgrid",
      region: "Lagos-Mainland"
    }, { headers: { Authorization: `Bearer ${authToken}` }});
    
    microgridId = mgRes.data.data.id;
    console.log(`[VPP-SIM] Created Microgrid: ${microgridId}`);

    // 2. Register Nodes
    for (const node of nodes) {
      await axios.post(`${API_URL}/api/vpp/nodes`, {
        microgridId,
        name: node.name,
        type: node.type
      }, { headers: { Authorization: `Bearer ${authToken}` }});
      console.log(`[VPP-SIM] Created Node: ${node.name}`);
    }

  } catch (error: any) {
    console.error("[VPP-SIM] Topology setup failed:", error.response?.data || error.message);
    // Continue if already exists (MVP tolerance)
  }
}

async function simulateTelemetry() {
  setInterval(async () => {
    // We send raw telemetry for devices that belong to the new nodes
    // The EnergyRoutingService in the backend is listening to this to build out Surplus/Deficits.

    
    // Simulate Solar Farm (High Generation)
    await sendTelemetry("vpp-solar-farm-1", "solar", { power_kw: 50 + Math.random() * 10, efficiency: 98, status: "active" });
    
    // Simulate House 1 (Prosumer - slight surplus)
    await sendTelemetry("vpp-house-1", "solar", { power_kw: 5 + Math.random() * 2, efficiency: 95, status: "active" });
    await sendTelemetry("vpp-house-1", "load", { consumption: 3 + Math.random(), peak_demand: 4, status: "normal" });

    // Simulate House 2 (Heavy Consumer - Deficit)
    await sendTelemetry("vpp-house-2", "load", { consumption: 10 + Math.random() * 2, peak_demand: 15, status: "normal" });

    // Simulate House 3 (Light Consumer - Deficit)
    await sendTelemetry("vpp-house-3", "load", { consumption: 2 + Math.random(), peak_demand: 4, status: "normal" });

    console.log("[VPP-SIM] Telemetry batch sent. Engine evaluating Surplus/Deficits...");

  }, 10000); // Every 10 seconds
}

async function sendTelemetry(deviceId: string, deviceType: string, metrics: any) {
  try {
    await axios.post(`${API_URL}/api/telemetry`, {
      deviceId,
      deviceType,
      metrics,
      timestamp: Date.now()
    }, { headers: { Authorization: `Bearer ${authToken}` }});
  } catch (error: any) {
    // Ignore console spam for demo
  }
}

async function start() {
  console.log("=== EnergyFlow OS: VPP Simulator ===");
  await login();
  await setupVppTopology();
  
  console.log("\n[VPP-SIM] Starting continuous generation & load simulation...");
  await simulateTelemetry();
}

start();
