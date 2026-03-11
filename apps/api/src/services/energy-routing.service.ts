import { eventEmitter } from "../controllers/events.controller";
import { 
  NodeNetPowerUpdatedEvent, 
  NodeEnergySurplusEvent, 
  NodeEnergyDeficitEvent,
  StorageStateChangedEvent
} from "../types/vpp.types";
import { GenerationEventSchema, ConsumptionEventSchema } from "@energy/event-schema";
import prisma from "../lib/prisma";

export class EnergyRoutingService {
  /**
   * Called periodically or reactively when telemetry updates node state
   * Calculates net power (Generation - Consumption) per node
   */
  static async evaluateNodeNetPower(nodeId: string, microgridId: string) {
    try {
      // In a real system, this would sum up realtime telemetry from the node's devices
      // For this MVP, we simulate reading latest metrics from Redis/Timescale
      
      // Calculate Generation
      let generationKw = 0;
      const producers = await prisma.energyProducer.findMany({ where: { nodeId } });
      for (const p of producers) {
        if (p.solarGeneratorId) {
          const latest = await prisma.solarReading.findFirst({
            where: { solarGeneratorId: p.solarGeneratorId },
            orderBy: { timestamp: 'desc' }
          });
          
          if (latest) {
             const genEvt = GenerationEventSchema.parse({
                nodeId,
                source: "SOLAR",
                kwProduced: latest.power_kw,
                timestamp: latest.timestamp.toISOString()
             });
             generationKw += genEvt.kwProduced;
          }
        }
      }

      // Calculate Consumption
      let consumptionKw = 0;
      const consumers = await prisma.energyConsumer.findMany({ where: { nodeId } });
      for (const c of consumers) {
        if (c.energyLoadId) {
          const latest = await prisma.loadReading.findFirst({
            where: { energyLoadId: c.energyLoadId },
            orderBy: { timestamp: 'desc' }
          });
          
          if (latest) {
             const conEvt = ConsumptionEventSchema.parse({
                nodeId,
                kwConsumed: latest.consumption_kw,
                timestamp: latest.timestamp.toISOString()
             });
             consumptionKw += conEvt.kwConsumed;
          }
        }
      }

      const netPowerKw = generationKw - consumptionKw;
      const isSurplus = netPowerKw > 0;
      
      const evt: NodeNetPowerUpdatedEvent = {
        nodeId,
        microgridId,
        timestamp: Date.now(),
        netPowerKw: Math.abs(netPowerKw),
        isSurplus
      };
      
      eventEmitter.emit("vpp:netPowerUpdated", evt);

      if (isSurplus) {
        // Emit Surplus for P2P trading or Battery Charging
        const surplusEvt: NodeEnergySurplusEvent = {
          nodeId,
          microgridId,
          surplusKw: netPowerKw,
          pricePreference: 0.15, // Default/configured price
          timestamp: Date.now()
        };
        eventEmitter.emit("vpp:energySurplus", surplusEvt);
      } else if (netPowerKw < 0) {
        // Emit Deficit
        const deficitEvt: NodeEnergyDeficitEvent = {
          nodeId,
          microgridId,
          deficitKw: Math.abs(netPowerKw),
          maxPrice: 0.30, // Default max price willing to pay
          timestamp: Date.now()
        };
        eventEmitter.emit("vpp:energyDeficit", deficitEvt);
      }
    } catch (error) {
      console.error(`[EnergyRoutingService] Error evaluating node ${nodeId}:`, error);
    }
  }
}
