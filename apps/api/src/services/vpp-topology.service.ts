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
    return prisma.energyNode.create({ data });
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
