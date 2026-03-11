import { EnergyProfile } from "../models/EnergyProfile";
import { 
  GenerationEventSchema, 
  ConsumptionEventSchema,
  TelemetryBatchEventSchema
} from "@energy/event-schema";
import axios from "axios";
import { randomUUID } from "crypto";

export interface SimulatedNode {
  id: string;
  hasSolar: boolean;
  baseLoadKw: number;
  solarCapacityKw: number;
}

export class TickEngine {
  private nodes: SimulatedNode[] = [];
  private apiUrl: string;
  private apiToken: string;
  private microgridId: string;
  
  // Simulation Time mapping (e.g. 1 tick = 15 minutes of simulated time)
  private currentVirtualHour: number = 10; // Start at 10 AM for daylight data

  constructor(apiUrl: string, apiToken: string, microgridId: string) {
    this.apiUrl = apiUrl;
    this.apiToken = apiToken;
    this.microgridId = microgridId;
  }

  registerNode(node: SimulatedNode) {
    this.nodes.push(node);
  }

  /**
   * Advances the simulation by 1 tick (Default: 15 virtual minutes)
   */
  async tick() {
    this.currentVirtualHour += 0.25; 
    if (this.currentVirtualHour >= 24) {
      this.currentVirtualHour = 0;
      console.log(`[Simulator] 🌅 A new virtual day begins.`);
    }

    const generationEvents: any[] = [];
    const consumptionEvents: any[] = [];

    const virtualISOTime = new Date().toISOString(); // We use real time for the DB MVP, but profiles are based on virtual hour

    for (const node of this.nodes) {
      // 1. Calculate Load
      const currentLoad = EnergyProfile.generateLoad(this.currentVirtualHour, node.baseLoadKw);
      const conEvt = ConsumptionEventSchema.parse({
         nodeId: node.id,
         kwConsumed: currentLoad,
         timestamp: virtualISOTime
      });
      consumptionEvents.push(conEvt);

      // 2. Calculate Solar
      if (node.hasSolar) {
        const currentGen = EnergyProfile.generateSolar(this.currentVirtualHour, node.solarCapacityKw);
        console.log(`[Simulator:Node] ${node.id.substring(0,8)} | Hour ${this.currentVirtualHour} | Solar: ${currentGen.toFixed(2)}kW`);
        const genEvt = GenerationEventSchema.parse({
           nodeId: node.id,
           source: "SOLAR",
           kwProduced: currentGen,
           timestamp: virtualISOTime
        });
        generationEvents.push(genEvt);
      }
    }

    // 3. Construct Batch Event
    const batch = TelemetryBatchEventSchema.parse({
      batchId: randomUUID(),
      microgridId: this.microgridId,
      timestamp: virtualISOTime,
      generation: generationEvents,
      consumption: consumptionEvents
    });

    // 4. Push to API
    try {
      await axios.post(`${this.apiUrl}/vpp/telemetry/batch`, batch, {
        headers: { Authorization: `Bearer ${this.apiToken}` }
      });
      const hh = Math.floor(this.currentVirtualHour).toString().padStart(2, '0');
      const mm = ((this.currentVirtualHour % 1) * 60).toString().padStart(2, '0');
      console.log(`[Simulator ${hh}:${mm}] Pushed batch to API (${this.nodes.length} nodes)`);
    } catch (error: any) {
      console.error(`[Simulator] Failed to push batch to API: ${error.message}`);
    }
  }

  start(tickIntervalMs: number) {
    console.log(`[Simulator] Starting engine at ${tickIntervalMs}ms/tick...`);
    // Run first tick immediately
    this.tick();
    setInterval(() => this.tick(), tickIntervalMs);
  }
}
