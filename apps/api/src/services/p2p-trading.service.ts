import { eventEmitter } from "../controllers/events.controller";
import { NodeEnergySurplusEvent, NodeEnergyDeficitEvent } from "../types/vpp.types";
import { TradeExecutedEventSchema } from "@energy/event-schema";
import prisma from "../lib/prisma";
import { energyEngine } from "../lib/energy-engine.client";

// Simple in-memory order book for MVP
const surplusOrders: NodeEnergySurplusEvent[] = [];
const deficitOrders: NodeEnergyDeficitEvent[] = [];

export class PeerToPeerTradingService {
  /**
   * Initialize event listeners for the matchmaking engine
   */
  static init() {
    console.log("[P2PTrading] Initializing matchmaking engine...");
    eventEmitter.on("vpp:energySurplus", (evt: NodeEnergySurplusEvent) => {
      console.log(`[P2PTrading] Order Book: Added Surplus from ${evt.nodeId} (${evt.surplusKw}kW)`);
      surplusOrders.push(evt);
      this.matchOrders();
    });

    eventEmitter.on("vpp:energyDeficit", (evt: NodeEnergyDeficitEvent) => {
      console.log(`[P2PTrading] Order Book: Added Deficit from ${evt.nodeId} (${evt.deficitKw}kW)`);
      deficitOrders.push(evt);
      this.matchOrders();
    });
  }

  private static async matchOrders() {
    if (surplusOrders.length === 0 || deficitOrders.length === 0) return;

    // Gather current orders — all must be in the same microgrid for one LP solve
    const microgridId = surplusOrders[0]?.microgridId ?? deficitOrders[0]?.microgridId;
    if (!microgridId) return; // guard: should never happen given checks above

    // ── Python Engine Path (CVXPY Linear Program) ──────────────────
    try {
      const engineHealthy = await energyEngine.isHealthy();
      if (engineHealthy) {
        const nodes = [
          ...surplusOrders
            .filter(s => s.microgridId === microgridId)
            .map(s => ({
              node_id: s.nodeId,
              surplus_kw: s.surplusKw,
              deficit_kw: 0,
              min_price: s.pricePreference,
              max_price: s.pricePreference,
            })),
          ...deficitOrders
            .filter(d => d.microgridId === microgridId)
            .map(d => ({
              node_id: d.nodeId,
              surplus_kw: 0,
              deficit_kw: d.deficitKw,
              min_price: d.maxPrice,
              max_price: d.maxPrice,
            })),
        ];

        const result = await energyEngine.optimizeP2PTrades(microgridId, nodes);
        console.log(
          `[P2PTrading][Python] Optimizer solved (${result.summary.solver_status}). ` +
          `P2P ratio: ${result.summary.p2p_ratio_pct.toFixed(1)}% | ` +
          `Peer traded: ${result.summary.total_peer_traded_kw.toFixed(2)} kW`
        );

        // Execute every trade the optimizer resolved
        for (const trade of result.trades) {
          if (trade.type === "P2P") {
            await this.executeTrade({
              sellerNodeId: trade.seller_node_id,
              buyerNodeId: trade.buyer_node_id,
              amountKw: trade.amount_kw,
              price: trade.price_per_kwh,
              microgridId,
            });
          } else if (trade.type === "GRID_IMPORT") {
            const gridNode = await prisma.energyNode.findFirst({
              where: { microgridId, name: "Main Utility Connection" },
            });
            if (gridNode) {
              await this.executeTrade({
                sellerNodeId: gridNode.id,
                buyerNodeId: trade.buyer_node_id,
                amountKw: trade.amount_kw,
                price: trade.price_per_kwh,
                microgridId,
              });
            }
          } else if (trade.type === "GRID_EXPORT") {
            const gridNode = await prisma.energyNode.findFirst({
              where: { microgridId, name: "Main Utility Connection" },
            });
            if (gridNode) {
              await this.executeTrade({
                sellerNodeId: trade.seller_node_id,
                buyerNodeId: gridNode.id,
                amountKw: trade.amount_kw,
                price: trade.price_per_kwh,
                microgridId,
              });
            }
          }
        }

        // Clear all processed orders
        surplusOrders.length = 0;
        deficitOrders.length = 0;
        return;
      }
    } catch (err: any) {
      console.warn(`[P2PTrading] Python engine unavailable (${err.message}). Falling back to order-book.`);
    }

    // ── Fallback: original TypeScript order-book matching ──────────
    surplusOrders.sort((a, b) => a.pricePreference - b.pricePreference);
    deficitOrders.sort((a, b) => b.maxPrice - a.maxPrice);

    let matchMade = false;
    while (surplusOrders.length > 0 && deficitOrders.length > 0) {
      const surplus = surplusOrders[0];
      const deficit = deficitOrders[0];

      if (!surplus || !deficit) break;

      if (
        surplus.microgridId === deficit.microgridId &&
        deficit.maxPrice >= surplus.pricePreference
      ) {
        const clearingPrice = (deficit.maxPrice + surplus.pricePreference) / 2;
        const amountKw = Math.min(surplus.surplusKw, deficit.deficitKw);

        surplus.surplusKw -= amountKw;
        deficit.deficitKw -= amountKw;

        await this.executeTrade({
          sellerNodeId: surplus.nodeId,
          buyerNodeId: deficit.nodeId,
          amountKw,
          price: clearingPrice,
          microgridId: surplus.microgridId,
        });

        matchMade = true;

        if (surplus.surplusKw <= 0) surplusOrders.shift();
        if (deficit.deficitKw <= 0) deficitOrders.shift();
      } else {
        break;
      }
    }

    // Grid Fallback for remaining orders
    if (surplusOrders.length > 0) {
      for (const surplus of surplusOrders) {
        if (surplus.surplusKw > 0) {
          const gridNode = await prisma.energyNode.findFirst({
            where: { microgridId: surplus.microgridId, name: "Main Utility Connection" }
          });
          if (gridNode) {
            await this.executeTrade({
              sellerNodeId: surplus.nodeId,
              buyerNodeId: gridNode.id,
              amountKw: surplus.surplusKw,
              price: 0.08,
              microgridId: surplus.microgridId,
            });
          }
        }
      }
      surplusOrders.length = 0;
    }

    if (deficitOrders.length > 0) {
      for (const deficit of deficitOrders) {
        if (deficit.deficitKw > 0) {
          const gridNode = await prisma.energyNode.findFirst({
            where: { microgridId: deficit.microgridId, name: "Main Utility Connection" }
          });
          if (gridNode) {
            await this.executeTrade({
              sellerNodeId: gridNode.id,
              buyerNodeId: deficit.nodeId,
              amountKw: deficit.deficitKw,
              price: 0.25,
              microgridId: deficit.microgridId,
            });
          }
        }
      }
      deficitOrders.length = 0;
    }

    if (matchMade) {
      console.log(`[P2PTrading][Fallback] Successfully matched orders.`);
    }
  }

  private static async executeTrade(params: { sellerNodeId: string; buyerNodeId: string; amountKw: string | number; price: number; microgridId: string }) {
    try {
      const trade = await prisma.energyTrade.create({
        data: {
          microgridId: params.microgridId,
          sellerNodeId: params.sellerNodeId,
          buyerNodeId: params.buyerNodeId,
          amount_kwh: typeof params.amountKw === 'string' ? parseFloat(params.amountKw) : params.amountKw,
          pricePerKwh: params.price,
          status: "COMPLETED",
        }
      });

      const amountNum = typeof params.amountKw === 'string' ? parseFloat(params.amountKw) : params.amountKw;
      const totalCost = amountNum * params.price;

      const tradeData = {
        tradeId: trade.id,
        microgridId: params.microgridId,
        sellerNodeId: params.sellerNodeId,
        buyerNodeId: params.buyerNodeId,
        kwTransferred: amountNum,
        pricePerKw: params.price,
        totalCost: totalCost,
        timestamp: new Date().toISOString()
      };

      // Strict validation via Zod
      const tradeEvt = TradeExecutedEventSchema.parse(tradeData);

      eventEmitter.emit("vpp:tradeExecuted", tradeEvt);
    } catch (error) {
      console.error("[P2PTrading] Failed to execute trade:", error);
    }
  }
}

// Global initialization
// End of PeerToPeerTradingService
