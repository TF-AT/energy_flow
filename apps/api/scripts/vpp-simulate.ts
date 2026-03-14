import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const API_URL = process.env.API_URL || "http://localhost:3001";
let authToken: string | null = null;
let microgridId: string | null = null;

const nodeConfigs = [
  { type: "GRID_CONNECTION", name: "Community Solar Farm", hasSolar: true, maxGenerationKw: 100 },
  { type: "HOUSE", name: "House 1 (Producer)", hasSolar: true, maxGenerationKw: 10, baseLoadKw: 3 },
  { type: "HOUSE", name: "House 2 (Consumer)", hasSolar: false, baseLoadKw: 12 },
  { type: "HOUSE", name: "House 3 (Consumer)", hasSolar: false, baseLoadKw: 5 },
];

async function login() {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: "admin@energyflow.com",
      password: "password123",
    });
    authToken = response.data.data.token;
    console.log("[VPP-SIM] Authenticated successfully.");
    console.log("[VPP-SIM] Token length:", authToken?.length);
    console.log("[VPP-SIM] User:", response.data.data.user);
  } catch (error: any) {
    console.error("[VPP-SIM] Auth failed:", error.message);
    process.exit(1);
  }
}

async function setupVppTopology() {
  console.log("[VPP-SIM] Setting up VPP Topology...");
  
  try {
    // 1. Create Microgrid
    const mgRes = await axios.post(`${API_URL}/api/vpp/microgrids`, {
      name: "Demo VPP Microgrid",
      region: "Lagos-Mainland"
    }, { headers: { Authorization: `Bearer ${authToken}` }});
    
    microgridId = mgRes.data.data.id;
    console.log(`[VPP-SIM] Created Microgrid: ${microgridId}`);

    // 2. Register Nodes
    for (const config of nodeConfigs) {
      const nodeRes = await axios.post(`${API_URL}/api/vpp/nodes`, {
        microgridId,
        ...config
      }, { headers: { Authorization: `Bearer ${authToken}` }});
      console.log(`[VPP-SIM] Created Node: ${config.name} (ID: ${nodeRes.data.data.id})`);
    }

  } catch (error: any) {
    console.warn("[VPP-SIM] Topology setup notice:", error.response?.data?.error || error.message);
    // Continue - might already exist
  }
}

async function simulateTelemetry() {
  if (!microgridId) {
    // Try to find an existing one if creation failed
    const res = await axios.get(`${API_URL}/api/vpp/microgrids`, {
       headers: { Authorization: `Bearer ${authToken}` }
    });
    const mg = res.data.data.find((m: any) => m.name === "Demo VPP Microgrid");
    if (mg) microgridId = mg.id;
    else {
      console.error("[VPP-SIM] Could not find or create microgrid.");
      return;
    }
  }

  console.log(`[VPP-SIM] Starting telemetry loop for Microgrid: ${microgridId}`);

  setInterval(async () => {
    try {
      // Refresh nodes list to get latest IDs
      const res = await axios.get(`${API_URL}/api/vpp/microgrids`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const mg = res.data.data.find((m: any) => m.id === microgridId);
      if (!mg || !mg.nodes) return;

      const timestamp = new Date().toISOString();
      const generation: any[] = [];
      const consumption: any[] = [];

      for (const node of mg.nodes) {
        if (node.hasSolar) {
          generation.push({
            nodeId: node.id,
            source: "SOLAR",
            kwProduced: (node.maxGenerationKw || 5) * (0.7 + Math.random() * 0.3),
            timestamp
          });
        }
        
        if (node.type === "HOUSE" || node.type === "CONSUMER" || node.type === "GRID_CONNECTION") {
          consumption.push({
            nodeId: node.id,
            kwConsumed: (node.baseLoadKw || 5) * (0.8 + Math.random() * 0.4),
            timestamp
          });
        }
      }

      await axios.post(`${API_URL}/api/vpp/telemetry/batch`, {
        microgridId,
        timestamp,
        generation,
        consumption
      }, { headers: { Authorization: `Bearer ${authToken}` }});

      console.log(`[VPP-SIM] Telemetry batch sent: ${generation.length} gens, ${consumption.length} cons.`);
    } catch (err: any) {
      console.error("[VPP-SIM] Loop error:", err.response?.data?.error || err.message);
    }
  }, 5000); 
}

async function start() {
  console.log("=== EnergyFlow OS: VPP Simulator ===");
  await login();
  await setupVppTopology();
  
  await simulateTelemetry();
}

start();
