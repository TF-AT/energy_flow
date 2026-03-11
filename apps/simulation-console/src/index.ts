import { Command } from "commander";
import { TickEngine, SimulatedNode } from "./engine/TickEngine";
import { randomUUID } from "crypto";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const program = new Command();

program
  .name("vpp-simulator")
  .description("High-performance simulation engine for EnergyFlow OS")
  .version("1.0.0");

program.command("run")
  .description("Start simulating a microgrid")
  .option("-n, --nodes <number>", "Number of nodes to simulate", "10")
  .option("-i, --interval <ms>", "Tick interval in milliseconds", "5000")
  .option("-u, --url <url>", "API Base URL", "http://localhost:3001/api")
  .action(async (options) => {
    console.log(`🚀 Starting VPP Simulator Engine`);
    console.log(`Config: ${options.nodes} nodes, ${options.interval}ms interval\n`);

    const numNodes = parseInt(options.nodes);
    const intervalMs = parseInt(options.interval);
    
    // 1. Provision Auth & Demo Microgrid against the API
    let token = process.env.VPP_ADMIN_TOKEN;
    if (!token) {
        // Fallback or handle login if needed for MVP
        try {
           const res = await axios.post(`${options.url}/auth/login`, {
              email: "admin@energyflow.com",
              password: "password123"
           });
           token = res.data.data.token;
        } catch (e) {
           console.error("Failed to authenticate to API:", e);
           process.exit(1);
        }
    }

    try {
        // Provision Microgrid
        const mgRes = await axios.post(`${options.url}/vpp/microgrids`, {
            name: `Simulator Grid (${numNodes} Nodes)`,
            region: "Lagos Virtual"
        }, { headers: { Authorization: `Bearer ${token}` }});
        
        const microgridId = mgRes.data.data.id;
        console.log(`✅ Provisioned Microgrid: ${microgridId}`);

        const engine = new TickEngine(options.url, token as string, microgridId);

        // Provision Nodes physically in DB
        for (let i = 0; i < numNodes; i++) {
            const hasSolar = Math.random() > 0.4; // 60% have solar
            
            // Register Node in DB
            const nodeRes = await axios.post(`${options.url}/vpp/nodes`, {
                microgridId: microgridId,
                name: `VirtualHome-${i+1}`,
                type: hasSolar ? 'PROSUMER' : 'CONSUMER',
                hasSolar: hasSolar,
                hasBattery: false,
                baseLoadKw: 2.5 + (Math.random() * 2), // 2.5 to 4.5 baseline
                maxGenerationKw: hasSolar ? 6.0 + (Math.random() * 4) : 0 // 6.0 to 10.0 solar peak
            }, { headers: { Authorization: `Bearer ${token}` }});

            const dbNode = nodeRes.data.data;

            // Register Actor in Memory Simulator Engine
            engine.registerNode({
                id: dbNode.id,
                hasSolar: dbNode.hasSolar,
                baseLoadKw: dbNode.baseLoadKw || 3.0,
                solarCapacityKw: dbNode.maxGenerationKw || 0
            });
        }
        console.log(`✅ Hooked ${numNodes} virtual nodes to engine.`);
        
        // Start Loops
        engine.start(intervalMs);

    } catch (error: any) {
        console.error("Failed to provision environment:", error.response?.data || error.message);
    }
  });

program.parse();
