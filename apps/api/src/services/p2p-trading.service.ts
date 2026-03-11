import { eventEmitter } from "../controllers/events.controller";
import { NodeEnergySurplusEvent, NodeEnergyDeficitEvent } from "../types/vpp.types";
import { TradeExecutedEventSchema } from "@energy/event-schema";
import prisma from "../lib/prisma";

// Simple in-memory order book for MVP
const surplusOrders: NodeEnergySurplusEvent[] = [];
const deficitOrders: NodeEnergyDeficitEvent[] = [];

export class PeerToPeerTradingService {
  /**
   * Initialize event listeners for the matchmaking engine
   */
  static init() {
    eventEmitter.on("vpp:energySurplus", (evt: NodeEnergySurplusEvent) => {
      surplusOrders.push(evt);
      this.matchOrders();
    });

    eventEmitter.on("vpp:energyDeficit", (evt: NodeEnergyDeficitEvent) => {
      deficitOrders.push(evt);
      this.matchOrders();
    });
  }

  private static async matchOrders() {
    if (surplusOrders.length === 0 || deficitOrders.length === 0) return;

    // Simple matching: Sort surplus by lowest price, deficit by highest willing
    surplusOrders.sort((a, b) => a.pricePreference - b.pricePreference);
    deficitOrders.sort((a, b) => b.maxPrice - a.maxPrice);

    let matchMade = false;
    let i = 0;
    while (i < surplusOrders.length && j < deficitOrders.length) {
      const surplus = surplusOrders[i];
      const deficit = deficitOrders[j];

      if (!surplus || !deficit) break;

      // Match found if price overlaps and they are in the same microgrid
      if (
        surplus.microgridId === deficit.microgridId &&
        deficit.maxPrice >= surplus.pricePreference
      ) {
        // Find clearing price (avg)
        const clearingPrice = (deficit.maxPrice + surplus.pricePreference) / 2;
        
        // Find traded amount (min of surplus/deficit)
        const amountKw = Math.min(surplus.surplusKw, deficit.deficitKw);

        // Deduct from amounts
        surplus.surplusKw -= amountKw;
        deficit.deficitKw -= amountKw;

        // Execute trade
        await this.executeTrade({
          sellerNodeId: surplus.nodeId,
          buyerNodeId: deficit.nodeId,
          amountKw,
          price: clearingPrice,
          microgridId: surplus.microgridId,
        });

        matchMade = true;

        if (surplus.surplusKw <= 0) surplusOrders.splice(i, 1);
        else j++;

        if (deficit.deficitKw <= 0) deficitOrders.splice(j, 1);
      } else {
        // Not a match (price mismatch or different microgrid)
        // For simplicity, we just skip. In reality, a more complex queue is needed
        break;
      }
    }

    if (matchMade) {
      console.log(`[P2PTrading] Successfully matched orders.`);
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
let j = 0; // Fixes scoping issue and keeps loop simple for exact logic above
