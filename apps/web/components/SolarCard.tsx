import React from "react";
import Link from "next/link";
import { SolarGenerator } from "../lib/types";
import { Sun, Activity, Zap, ArrowRight } from "lucide-react";

export default function SolarCard({ generator }: { generator: SolarGenerator }) {
  const latestReading = generator.readings?.[0];
  const isActive = latestReading?.status === 'active';
  
  return (
    <div className={`bg-[#16161a] p-6 rounded-2xl border ${!isActive ? 'border-rose-500/30' : 'border-[#2d2d33]'} hover:border-amber-500/50 transition-all shadow-xl group`}>
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 group-hover:scale-110 transition-transform">
          <Sun size={24} />
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${!isActive ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
          {isActive ? 'Generating' : 'Standby'}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-1">{generator.id}</h3>
        <p className="text-xs text-[#94a3b8] font-medium">{generator.location}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-3 bg-[#111114] rounded-xl border border-[#2d2d33]">
          <div className="text-[9px] font-bold text-[#64748b] tracking-widest uppercase mb-1">Power Output</div>
          <div className="text-sm font-black text-white">{latestReading?.power_kw || 0} kW</div>
        </div>
        <div className="p-3 bg-[#111114] rounded-xl border border-[#2d2d33]">
          <div className="text-[9px] font-bold text-[#64748b] tracking-widest uppercase mb-1">Efficiency</div>
          <div className="text-sm font-black text-white">{latestReading?.efficiency || 0}%</div>
        </div>
      </div>

      <Link 
        href={`/solar/${generator.id}`}
        className="flex items-center justify-between w-full px-4 py-3 bg-[#1e293b] hover:bg-amber-600 text-white rounded-xl transition-all text-xs font-bold"
      >
        View Detail & Distribution
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
