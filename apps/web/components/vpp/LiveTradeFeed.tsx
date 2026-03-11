"use client";

import { useVppStore, VppTrade } from "../../store/vppStore";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

export default function LiveTradeFeed() {
  const trades = useVppStore(state => state.recentTrades);

  return (
    <div className="bg-[#16161a] rounded-2xl border border-[#2d2d33] overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-[#2d2d33] bg-[#1a1a20] flex justify-between items-center">
        <div className="text-[10px] font-black text-[#64748b] tracking-widest uppercase">Live P2P Trade Feed</div>
        <div className="flex items-center gap-1">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase">Live</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {trades.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <Clock size={32} className="text-[#2d2d33] mb-4" />
            <p className="text-[#64748b] text-sm font-medium">Waiting for market matches...</p>
            <p className="text-[#3a3a42] text-[10px] mt-1">Trades will appear here in real-time as the simulator calculates surpluses.</p>
          </div>
        ) : (
          trades.map((trade: VppTrade) => (
            <div key={trade.tradeId} className="p-3 bg-[#111114] rounded-xl border border-[#2d2d33] hover:border-blue-500/30 transition-colors animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">#{trade.tradeId.substring(0, 8)}</span>
                <span className="text-[10px] font-medium text-[#475569]">{new Date(trade.timestamp).toLocaleTimeString()}</span>
              </div>
              
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="text-xs font-bold text-white truncate">{trade.sellerNodeId.split('-')[0]}...</div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase mt-0.5">
                    <ArrowUpRight size={10} /> Sell
                  </div>
                </div>
                
                <div className="px-3 text-center">
                  <div className="text-sm font-black text-white">{trade.kwTransferred.toFixed(2)}<span className="text-[10px] ml-0.5 text-[#64748b]">kW</span></div>
                  <div className="text-[10px] font-bold text-[#64748b]">${trade.pricePerKw.toFixed(2)}/kW</div>
                </div>

                <div className="flex-1 text-right">
                  <div className="text-xs font-bold text-white truncate">...{trade.buyerNodeId.split('-')[0]}</div>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-rose-400 font-bold uppercase mt-0.5">
                    Buy <ArrowDownRight size={10} />
                  </div>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-[#1e1e24] flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#64748b] uppercase">Settled Amount</span>
                <span className="text-xs font-black text-white">${trade.totalCost.toFixed(2)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
