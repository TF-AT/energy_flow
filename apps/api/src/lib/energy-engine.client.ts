/**
 * EnergyEngineClient — TypeScript HTTP client for the Python Energy Engine.
 * All energy simulation and optimization calls go through this client.
 */

import axios, { AxiosInstance } from "axios";

const ENGINE_URL = process.env.ENERGY_ENGINE_URL ?? "http://localhost:8000";

interface NodeTickInput {
  node_id: string;
  has_solar: boolean;
  base_load_kw: number;
  solar_capacity_kw: number;
  current_virtual_hour: number;
}

interface GridTickResult {
  microgrid_id: string;
  timestamp: string;
  nodes: Array<{
    node_id: string;
    hour: number;
    load_kw: number;
    solar_kw: number;
    net_kw: number;
  }>;
  grid_net_kw: number;
}

interface TradingNodeInput {
  node_id: string;
  surplus_kw: number;
  deficit_kw: number;
  min_price?: number;
  max_price?: number;
}

interface TradeResult {
  seller_node_id: string;
  buyer_node_id: string;
  amount_kw: number;
  price_per_kwh: number;
  total_cost: number;
  type: "P2P" | "GRID_IMPORT" | "GRID_EXPORT";
}

interface P2POptimizationResult {
  microgrid_id: string;
  status: string;
  trades: TradeResult[];
  summary: {
    total_peer_traded_kw: number;
    p2p_ratio_pct: number;
    objective_value: number | null;
    solver_status: string;
  };
}

class EnergyEngineClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ENGINE_URL,
      timeout: 10_000,
      headers: { "Content-Type": "application/json" },
    });
  }

  async isHealthy(): Promise<boolean> {
    try {
      const res = await this.client.get("/health");
      return res.data?.status === "ok";
    } catch {
      return false;
    }
  }

  /**
   * Run a grid tick — calculates load/solar for all nodes.
   * Replaces the TypeScript EnergyProfile calculations in TickEngine.ts.
   */
  async simulateGridTick(
    microgridId: string,
    nodes: NodeTickInput[]
  ): Promise<GridTickResult> {
    const res = await this.client.post<GridTickResult>("/simulate/tick", {
      microgrid_id: microgridId,
      nodes,
    });
    return res.data;
  }

  /**
   * Optimize P2P trades using the CVXPY linear program.
   * Replaces the hand-written order-book in PeerToPeerTradingService.
   */
  async optimizeP2PTrades(
    microgridId: string,
    nodes: TradingNodeInput[]
  ): Promise<P2POptimizationResult> {
    const res = await this.client.post<P2POptimizationResult>(
      "/optimize/p2p-trade",
      {
        microgrid_id: microgridId,
        nodes,
      }
    );
    return res.data;
  }

  /**
   * Generate a 24-hour daily energy profile for a node.
   */
  async getDailyProfile(
    nodeId: string,
    baseLoadKw: number,
    solarCapacityKw: number,
    resolutionMinutes = 15
  ) {
    const res = await this.client.post("/simulate/daily-profile", {
      node_id: nodeId,
      base_load_kw: baseLoadKw,
      solar_capacity_kw: solarCapacityKw,
      resolution_minutes: resolutionMinutes,
    });
    return res.data;
  }

  /**
   * Simulate battery schedule over a net-load time series.
   */
  async scheduleBattery(params: {
    nodeId: string;
    capacityKwh: number;
    initialSocPct: number;
    maxChargeKw: number;
    maxDischargeKw: number;
    netLoadKw: number[];
    resolutionMinutes?: number;
  }) {
    const res = await this.client.post("/optimize/battery-schedule", {
      node_id: params.nodeId,
      capacity_kwh: params.capacityKwh,
      initial_soc_pct: params.initialSocPct,
      max_charge_kw: params.maxChargeKw,
      max_discharge_kw: params.maxDischargeKw,
      net_load_kw: params.netLoadKw,
      resolution_minutes: params.resolutionMinutes ?? 15,
    });
    return res.data;
  }
}

// Export a singleton instance
export const energyEngine = new EnergyEngineClient();
