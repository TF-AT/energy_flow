import { EnergyProfile } from "../models/EnergyProfile";
import { 
  GenerationEventSchema, 
  ConsumptionEventSchema,
  TelemetryBatchEventSchema
} from "@energy/event-schema";
import axios from "axios";
import { randomUUID } from "crypto";

const ENGINE_URL = process.env.ENERGY_ENGINE_URL ?? "http://localhost:8000";

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
  private engineAvailable: boolean | null = null; // null = not yet tested

  constructor(apiUrl: string, apiToken: string, microgridId: string) {
    this.apiUrl = apiUrl;
    this.apiToken = apiToken;
    this.microgridId = microgridId;
  }

  registerNode(node: SimulatedNode) {
    this.nodes.push(node);
  }

  /**
   * Advances the simulation by 1 tick (Default: 15 virtual minutes).
   * Delegates to the Python energy engine when available.
   */
  async tick() {
    this.currentVirtualHour += 0.25; 
    if (this.currentVirtualHour >= 24) {
      this.currentVirtualHour = 0;
      console.log(`[Simulator] 🌅 A new virtual day begins.`);
    }

    // ── Python Engine Path ────────────────────────────────────────────
    try {
      if (this.engineAvailable !== false) {
        const engineRes = await axios.post(
          `${ENGINE_URL}/simulate/tick`,
          {
            microgrid_id: this.microgridId,
            nodes: this.nodes.map(n => ({
              node_id: n.id,
              has_solar: n.hasSolar,
              base_load_kw: n.baseLoadKw,
              solar_capacity_kw: n.solarCapacityKw,
              current_virtual_hour: this.currentVirtualHour,
            })),
          },
          { timeout: 5000 }
        );

        this.engineAvailable = true;
        const tickData = engineRes.data;

        const generationEvents: any[] = [];
        const consumptionEvents: any[] = [];
        const virtualISOTime = new Date().toISOString();

        for (const nodeResult of tickData.nodes) {
          const conEvt = ConsumptionEventSchema.parse({
            nodeId: nodeResult.node_id,
            kwConsumed: nodeResult.load_kw,
            timestamp: virtualISOTime,
          });
          consumptionEvents.push(conEvt);

          if (nodeResult.solar_kw > 0) {
            const genEvt = GenerationEventSchema.parse({
              nodeId: nodeResult.node_id,
              source: "SOLAR",
              kwProduced: nodeResult.solar_kw,
              timestamp: virtualISOTime,
            });
            generationEvents.push(genEvt);
          }
        }

        await this._pushBatch(generationEvents, consumptionEvents, virtualISOTime);
        const hh = Math.floor(this.currentVirtualHour).toString().padStart(2, "0");
        const mm = ((this.currentVirtualHour % 1) * 60).toString().padStart(2, "0");
        console.log(`[Simulator:Python ${hh}:${mm}] 🐍 Tick via energy engine (${this.nodes.length} nodes, grid net: ${tickData.grid_net_kw.toFixed(2)}kW)`);
        return;
      }
    } catch (err: any) {
      if (this.engineAvailable !== false) {
        console.warn(`[Simulator] Python energy engine unavailable (${err.message}). Using local calculations.`);
        this.engineAvailable = false;
      }
    }

    // ── Fallback: Local TypeScript calculations ───────────────────────
    const generationEvents: any[] = [];
    const consumptionEvents: any[] = [];
    const virtualISOTime = new Date().toISOString();

    for (const node of this.nodes) {
      const currentLoad = EnergyProfile.generateLoad(this.currentVirtualHour, node.baseLoadKw);
      const conEvt = ConsumptionEventSchema.parse({
         nodeId: node.id,
         kwConsumed: currentLoad,
         timestamp: virtualISOTime
      });
      consumptionEvents.push(conEvt);

      if (node.hasSolar) {
        const currentGen = EnergyProfile.generateSolar(this.currentVirtualHour, node.solarCapacityKw);
        const genEvt = GenerationEventSchema.parse({
           nodeId: node.id,
           source: "SOLAR",
           kwProduced: currentGen,
           timestamp: virtualISOTime
        });
        generationEvents.push(genEvt);
      }
    }

    await this._pushBatch(generationEvents, consumptionEvents, virtualISOTime);
    const hh = Math.floor(this.currentVirtualHour).toString().padStart(2, "0");
    const mm = ((this.currentVirtualHour % 1) * 60).toString().padStart(2, "0");
    console.log(`[Simulator:Local ${hh}:${mm}] Pushed batch to API (${this.nodes.length} nodes)`);
  }

  private async _pushBatch(generationEvents: any[], consumptionEvents: any[], timestamp: string) {
    const batch = TelemetryBatchEventSchema.parse({
      batchId: randomUUID(),
      microgridId: this.microgridId,
      timestamp,
      generation: generationEvents,
      consumption: consumptionEvents,
    });

    try {
      await axios.post(`${this.apiUrl}/vpp/telemetry/batch`, batch, {
        headers: { Authorization: `Bearer ${this.apiToken}` },
      });
    } catch (error: any) {
      console.error(`[Simulator] Failed to push batch to API: ${error.message}`);
    }
  }

  start(tickIntervalMs: number) {
    console.log(`[Simulator] Starting engine at ${tickIntervalMs}ms/tick...`);
    this.tick();
    setInterval(() => this.tick(), tickIntervalMs);
  }
}

