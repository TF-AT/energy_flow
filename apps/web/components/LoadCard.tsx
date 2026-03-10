import React from "react";
import Link from "next/link";
import { EnergyLoad } from "../lib/types";
import { Activity, Zap, TrendingUp, ArrowRight } from "lucide-react";

export default function LoadCard({ load }: { load: EnergyLoad }) {
  const latestReading = load.readings?.[0];
  const isHighLoad = (latestReading?.consumption_kw || 0) > (latestReading?.peak_demand_kw || 0) * 0.8;
  
  return (
    <div className={`bg-[#16161a] p-6 rounded-2xl border ${isHighLoad ? 'border-amber-500/30' : 'border-[#2d2d33]'} hover:border-blue-500/50 transition-all shadow-xl group`}>
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 group-hover:scale-110 transition-transform">
          <Activity size={24} />
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${isHighLoad ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
          {isHighLoad ? 'High Demand' : 'Normal Load'}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-1">{load.id}</h3>
        <p className="text-xs text-[#94a3b8] font-medium">{load.location}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-3 bg-[#111114] rounded-xl border border-[#2d2d33]">
          <div className="text-[9px] font-bold text-[#64748b] tracking-widest uppercase mb-1">Consumption</div>
          <div className="text-sm font-black text-white">{latestReading?.consumption_kw || 0} kW</div>
        </div>
        <div className="p-3 bg-[#111114] rounded-xl border border-[#2d2d33]">
          <div className="text-[9px] font-bold text-[#64748b] tracking-widest uppercase mb-1">Peak Demand</div>
          <div className="text-sm font-black text-white">{latestReading?.peak_demand_kw || 0} kW</div>
        </div>
      </div>

      <Link 
        href={`/loads/${load.id}`}
        className="flex items-center justify-between w-full px-4 py-3 bg-[#1e293b] hover:bg-blue-600 text-white rounded-xl transition-all text-xs font-bold"
      >
        View Load Profile
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
