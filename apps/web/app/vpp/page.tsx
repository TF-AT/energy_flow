"use client";

import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { api } from "../../lib/api";
import { Network, Zap, Activity } from "lucide-react";
import Link from "next/link";
import Breadcrumbs from "../../components/Breadcrumbs";

export default function VppDashboardPage() {
  const [microgrids, setMicrogrids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMicrogrids = async () => {
      try {
        const data = await api.getVppMicrogrids();
        setMicrogrids(data || []);
      } catch (error) {
        console.error("Failed to load microgrids:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMicrogrids();
  }, []);

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto">
        <Breadcrumbs items={[{ label: "Virtual Power Plants" }]} />
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">VPP Networks</h1>
            <p className="text-[#64748b] font-medium text-sm mt-1">Manage distributed energy microgrids and peer-to-peer trading</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <KPICard 
            icon={<Network size={24} className="text-blue-400" />}
            label="Active Microgrids"
            value={microgrids.length.toString()}
            trend="Stable"
            colorClass="from-blue-500/10 to-transparent border-blue-500/20"
          />
          <KPICard 
            icon={<Zap size={24} className="text-amber-400" />}
            label="Net Power Flow"
            value="Calculating..."
            trend="Live"
            colorClass="from-amber-500/10 to-transparent border-amber-500/20"
          />
          <KPICard 
            icon={<Activity size={24} className="text-emerald-400" />}
            label="P2P Trading Volume"
            value="$0.00"
            trend="Today"
            colorClass="from-emerald-500/10 to-transparent border-emerald-500/20"
          />
        </div>

        {/* Microgrid List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Active Deployments</h2>
          
          {loading ? (
            <div className="h-32 bg-[#16161a] rounded-2xl border border-[#2d2d33] animate-pulse" />
          ) : microgrids.length === 0 ? (
            <div className="p-8 bg-[#16161a] rounded-2xl border border-[#2d2d33] text-center">
              <p className="text-[#64748b]">No active microgrids found. Run the simulator to provision a network.</p>
            </div>
          ) : (
            microgrids.map(mg => (
              <Link key={mg.id} href={`/vpp/${mg.id}`}>
                <div className="group p-6 bg-[#16161a] rounded-2xl border border-[#2d2d33] hover:border-blue-500/50 transition-all flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <Network size={24} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{mg.name}</h3>
                      <p className="text-sm text-[#64748b]">{mg.region} • {mg.nodes?.length || 0} Registered Nodes</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-right">
                       <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Network Status</div>
                       <div className="text-emerald-400 font-black text-sm">CONNECTED</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

function KPICard({ icon, label, value, trend, colorClass }: { icon: React.ReactNode, label: string, value: string, trend: string, colorClass: string }) {
  return (
    <div className={`p-6 rounded-2xl bg-gradient-to-br ${colorClass} border bg-[#16161a]`}>
      <div className="flex justify-between items-start mb-4">
        {icon}
        <span className="px-2 py-1 bg-[#1e293b] rounded-full text-[10px] font-bold text-[#94a3b8] tracking-wider uppercase">
          {trend}
        </span>
      </div>
      <h3 className="text-[#64748b] text-xs font-bold uppercase tracking-widest mb-1">{label}</h3>
      <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
    </div>
  );
}
