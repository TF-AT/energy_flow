import React from "react";
import Link from "next/link";
import { BatteryStorage } from "../lib/types";
import { Battery, Zap, Thermometer, ArrowRight } from "lucide-react";

export default function BatteryCard({ battery }: { battery: BatteryStorage }) {
  const latestReading = battery.readings?.[0];
  const isCharging = (latestReading?.charge_rate_kw || 0) > 0;
  
  return (
    <div className={`bg-[#16161a] p-6 rounded-2xl border border-[#2d2d33] hover:border-emerald-500/50 transition-all shadow-xl group`}>
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform">
          <Battery size={24} />
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${isCharging ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
          {isCharging ? 'Charging' : 'Discharging'}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-1">{battery.id}</h3>
        <p className="text-xs text-[#94a3b8] font-medium">{battery.location}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-3 bg-[#111114] rounded-xl border border-[#2d2d33]">
          <div className="text-[9px] font-bold text-[#64748b] tracking-widest uppercase mb-1">State of Charge</div>
          <div className="text-sm font-black text-white">{latestReading?.soc_percentage || 0}%</div>
        </div>
        <div className="p-3 bg-[#111114] rounded-xl border border-[#2d2d33]">
          <div className="text-[9px] font-bold text-[#64748b] tracking-widest uppercase mb-1">Temperature</div>
          <div className="text-sm font-black text-white">{latestReading?.temperature || 0}°C</div>
        </div>
      </div>

      <Link 
        href={`/batteries/${battery.id}`}
        className="flex items-center justify-between w-full px-4 py-3 bg-[#1e293b] hover:bg-emerald-600 text-white rounded-xl transition-all text-xs font-bold"
      >
        View Battery Health
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
