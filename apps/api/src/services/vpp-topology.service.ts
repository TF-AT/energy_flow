import prisma from "../lib/prisma";

export class VppTopologyService {
  static async createMicrogrid(data: { organizationId: string; name: string; region: string }) {
    const mg = await prisma.microgrid.create({ data });
    
    // Auto-provision the Utility Grid node for this MG to enable fallbacks
    await prisma.energyNode.create({
      data: {
        microgridId: mg.id,
        name: "Main Utility Connection",
        type: "UTILITY_GRID", // Custom type
        hasSolar: false,
        hasBattery: false,
      }
    });

    return mg;
  }

  static async getMicrogrids(organizationId: string) {
    return prisma.microgrid.findMany({
      where: { organizationId },
      include: { nodes: true },
    });
  }

  static async createNode(data: { 
    microgridId: string; 
    name: string; 
    type: string; 
    siteId?: string;
    hasSolar?: boolean;
    hasBattery?: boolean;
    hasEvCharger?: boolean;
    maxGenerationKw?: number;
    baseLoadKw?: number;
    batteryCapacityKwh?: number;
  }) {
    // 1. Ensure we have a unique siteId for this node
    let siteId = data.siteId;
    if (!siteId) {
       const mg = await prisma.microgrid.findUnique({
         where: { id: data.microgridId },
         select: { organizationId: true }
       });
       
       if (mg) {
         // Create a unique virtual site for this node to satisfy @unique constraint
         const newSite = await prisma.site.create({
           data: {
             organizationId: mg.organizationId,
             name: `${data.name} Site`,
             location: "Distributed",
             capacity_kw: 1000,
           }
         });
         siteId = newSite.id;
       }
    }

    const node = await prisma.energyNode.create({ 
      data: { ...data, siteId } 
    });

    // Auto-provision related components for simulation/tracking
    if (data.hasSolar) {
      const solarGen = await prisma.solarGenerator.create({
        data: {
          id: `solar-${node.id}`,
          name: `${data.name} Solar`,
          location: "VPP-Calculated",
          siteId: siteId as string,
        }
      });
      await prisma.energyProducer.create({
        data: {
          nodeId: node.id,
          solarGeneratorId: solarGen.id,
          type: "SOLAR",
          capacity_kw: data.maxGenerationKw || 5.0
        }
      });
      // Also register as a Device for telemetry pipeline
      await prisma.device.create({
        data: {
          id: solarGen.id,
          siteId: siteId as string,
          type: "solar",
          protocol: "WEBHOOK"
        }
      });
    }

    if (data.type === "HOUSE" || data.type === "CONSUMER" || data.baseLoadKw) {
      const load = await prisma.energyLoad.create({
        data: {
          id: `load-${node.id}`,
          name: `${data.name} Load`,
          location: "VPP-Calculated",
          siteId: siteId as string,
        }
      });
      await prisma.energyConsumer.create({
        data: {
          nodeId: node.id,
          energyLoadId: load.id,
          type: "BUILDING_BASE_LOAD",
          maxDemand_kw: data.baseLoadKw || 10.0
        }
      });
      await prisma.device.create({
        data: {
          id: load.id,
          siteId: siteId as string,
          type: "load",
          protocol: "WEBHOOK"
        }
      });
    }

    return node;
  }

  static async getNode(nodeId: string) {
    return prisma.energyNode.findUnique({
      where: { id: nodeId },
      include: {
        producers: true,
        consumers: true,
        storages: true,
      },
    });
  }
}
