import prisma from "../lib/prisma";

export class VppTopologyService {
  static async createMicrogrid(data: { organizationId: string; name: string; region: string }) {
    return prisma.microgrid.create({ data });
  }

  static async getMicrogrids(organizationId: string) {
    return prisma.microgrid.findMany({
      where: { organizationId },
      include: { nodes: true },
    });
  }

  static async createNode(data: { microgridId: string; name: string; type: string; siteId?: string }) {
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
