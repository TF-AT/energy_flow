import prisma from "../lib/prisma";

export class SettlementService {
  /**
   * Calculates monthly or weekly settlements for a specific microgrid
   */
  static async calculateSettlement(microgridId: string, startDate: Date, endDate: Date) {
    try {
      const trades = await prisma.energyTrade.findMany({
        where: {
          microgridId,
          status: "COMPLETED",
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          seller: true,
          buyer: true
        }
      });

      // Aggregate balances
      const balances: Record<string, { nodeId: string, totalEarned: number, totalSpent: number, netBalance: number }> = {};

      for (const trade of trades) {
        const cost = trade.amount_kwh * trade.pricePerKwh;

        // Init seller
        if (!balances[trade.sellerNodeId]) balances[trade.sellerNodeId] = { nodeId: trade.sellerNodeId, totalEarned: 0, totalSpent: 0, netBalance: 0 };
        // Init buyer
        if (!balances[trade.buyerNodeId]) balances[trade.buyerNodeId] = { nodeId: trade.buyerNodeId, totalEarned: 0, totalSpent: 0, netBalance: 0 };

        balances[trade.sellerNodeId]!.totalEarned += cost;
        balances[trade.sellerNodeId]!.netBalance += cost;

        balances[trade.buyerNodeId]!.totalSpent += cost;
        balances[trade.buyerNodeId]!.netBalance -= cost;
      }

      return Object.values(balances);

    } catch (error) {
      console.error("[SettlementService] Failed to calculate settlements:", error);
      return [];
    }
  }
}
