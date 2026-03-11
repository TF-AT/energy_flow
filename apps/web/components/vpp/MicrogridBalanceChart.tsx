"use client";

import { useVppStore } from "../../store/vppStore";
import { Zap, Globe, Share2 } from "lucide-react";

export default function MicrogridBalanceChart() {
  const nodeStates = useVppStore(state => state.nodeStates);
  
  // Aggregate Metrics
  const states = Object.values(nodeStates);
  const totalNodes = states.length;
  
  let localSurplusKw = 0;
  let localDeficitKw = 0;
  
  states.forEach(s => {
    if (s.isSurplus) localSurplusKw += s.netPowerKw;
    else localDeficitKw += s.netPowerKw;
  });

  const netBalance = localSurplusKw - localDeficitKw;
  const isGridExporting = netBalance > 0;
  
  // Calculate self-sufficiency %
  const totalConsumption = localDeficitKw;
  const selfSufficiency = totalConsumption > 0 
    ? Math.min(100, (localSurplusKw / totalConsumption) * 100) 
    : 0;

  return (
    <div className="p-6 bg-[#16161a] rounded-2xl border border-[#2d2d33] h-full flex flex-col">
      <div className="text-[10px] font-black text-[#64748b] tracking-widest uppercase mb-6">Microgrid Balance Strategy</div>
      
      <div className="flex-1 flex flex-col justify-center gap-8">
        {/* Self Sufficiency Gauge */}
        <div className="relative flex flex-col items-center">
           <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80" cy="80" r="70"
                  fill="transparent"
                  stroke="#1e1e24"
                  strokeWidth="12"
                />
                <circle
                  cx="80" cy="80" r="70"
                  fill="transparent"
                  stroke={selfSufficiency > 80 ? "#10b981" : selfSufficiency > 50 ? "#f59e0b" : "#3b82f6"}
                  strokeWidth="12"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * selfSufficiency) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white tracking-tighter">{Math.round(selfSufficiency)}%</span>
                <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Self-Sufficient</span>
              </div>
           </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-[#111114] rounded-xl border border-[#2d2d33]">
             <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <Share2 size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Local Surplus</span>
             </div>
             <div className="text-xl font-black text-white">{localSurplusKw.toFixed(2)}<span className="text-xs text-[#64748b] ml-1">kW</span></div>
          </div>
          <div className="p-4 bg-[#111114] rounded-xl border border-[#2d2d33]">
             <div className="flex items-center gap-2 text-rose-400 mb-1">
                <Zap size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Local Deficit</span>
             </div>
             <div className="text-xl font-black text-white">{localDeficitKw.toFixed(2)}<span className="text-xs text-[#64748b] ml-1">kW</span></div>
          </div>
        </div>

        {/* Grid fallback status */}
        <div className="mt-auto p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isGridExporting ? 'bg-emerald-500/10' : 'bg-blue-500/10'}`}>
                 <Globe size={20} className={isGridExporting ? 'text-emerald-400' : 'text-blue-400'} />
              </div>
              <div>
                 <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Utility Grid Status</div>
                 <div className="text-xs font-black text-white uppercase">{isGridExporting ? 'Exporting Excess' : 'Importing Shortfall'}</div>
              </div>
           </div>
           <div className={`text-sm font-black ${isGridExporting ? 'text-emerald-400' : 'text-blue-400'}`}>
              {Math.abs(netBalance).toFixed(2)} kW
           </div>
        </div>
      </div>
    </div>
  );
}
