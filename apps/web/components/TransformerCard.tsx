import React from "react";
import Link from "next/link";
import { Transformer } from "../lib/types";
import { Server, Activity, AlertTriangle, ArrowRight } from "lucide-react";

export default function TransformerCard({ transformer }: { transformer: Transformer }) {
  const hasAlerts = transformer.alerts && transformer.alerts.length > 0;
  
  return (
    <div className={`bg-[#16161a] p-6 rounded-2xl border ${hasAlerts ? 'border-rose-500/30' : 'border-[#2d2d33]'} hover:border-blue-500/50 transition-all shadow-xl group`}>
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-[#1e293b] rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
          <Server size={24} />
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${hasAlerts ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
          {hasAlerts ? 'Warning' : 'Healthy'}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-1">{transformer.id}</h3>
        <p className="text-xs text-[#94a3b8] font-medium">{transformer.location}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-3 bg-[#111114] rounded-xl border border-[#2d2d33]">
          <div className="text-[9px] font-bold text-[#64748b] tracking-widest uppercase mb-1">Capacity</div>
          <div className="text-sm font-black text-white">{transformer.capacity_kw} kW</div>
        </div>
        <div className="p-3 bg-[#111114] rounded-xl border border-[#2d2d33]">
          <div className="text-[9px] font-bold text-[#64748b] tracking-widest uppercase mb-1">Devices</div>
          <div className="text-sm font-black text-white">{transformer.devices?.length || 0} units</div>
        </div>
      </div>

      <Link 
        href={`/transformers/${transformer.id}`}
        className="flex items-center justify-between w-full px-4 py-3 bg-[#1e293b] hover:bg-blue-600 text-white rounded-xl transition-all text-xs font-bold"
      >
        View Detailed Metrics
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
