"use client";

import { useEffect, useState, use } from "react";
import Layout from "../../../components/Layout";
import { api } from "../../../lib/api";
import { Network, ArrowLeft, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import Link from "next/link";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { useVppStore } from "../../../store/vppStore";
import LiveTradeFeed from "../../../components/vpp/LiveTradeFeed";
import MicrogridBalanceChart from "../../../components/vpp/MicrogridBalanceChart";

export default function MicrogridDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [microgrid, setMicrogrid] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Real-time State from Store
  const nodeStates = useVppStore(state => state.nodeStates);

  useEffect(() => {
    const fetchTopology = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const mgRes = await fetch(`http://localhost:3001/api/vpp/microgrids`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const mgData = await mgRes.json();
        const specificMg = mgData.data.find((m: any) => m.id === id);
        setMicrogrid(specificMg);
      } catch (error) {
        console.error("Failed to fetch microgrid details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopology();
  }, [id]);

  if (loading || !microgrid) {
    return (
      <Layout>
        <div className="animate-pulse space-y-8 max-w-[1400px] mx-auto">
          <div className="h-20 bg-[#16161a] rounded-2xl border border-[#2d2d33]" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-[500px] bg-[#16161a] rounded-2xl border border-[#2d2d33]" />
            <div className="h-[500px] bg-[#16161a] rounded-2xl border border-[#2d2d33]" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto">
        <Breadcrumbs 
          items={[
            { label: "Virtual Power Plants", href: "/vpp" },
            { label: microgrid.name }
          ]} 
        />
        
        <div className="mb-8">
          <Link href="/vpp" className="inline-flex items-center gap-2 text-sm font-bold text-[#64748b] hover:text-blue-400 transition-colors mb-4 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Networks
          </Link>
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                {microgrid.name}
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] tracking-widest align-middle">LIVE NETWORK</span>
                </div>
              </h2>
              <p className="text-sm text-[#64748b] font-medium mt-1">{microgrid.region} • ID: {microgrid.id}</p>
            </div>
          </div>
        </div>

        {/* Core Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 1. Network Topology Visualizer (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Network size={20} className="text-blue-400" />
                Real-Time Topology
              </h3>
              <div className="flex gap-4 text-[10px] font-black tracking-widest text-[#64748b] uppercase">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Surplus</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Deficit</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2d2d33]"></span> Standby</span>
              </div>
            </div>

            <div className="bg-[#16161a] p-8 rounded-2xl border border-[#2d2d33] shadow-xl relative overflow-hidden h-[600px] flex items-center justify-center">
              {/* Central Hub / Utility Grid Connection */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                 <div className="w-20 h-20 rounded-full bg-[#1e293b] border-2 border-[#334155] flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                    <Activity size={32} className="text-blue-400" />
                 </div>
                 <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">Local Router</span>
              </div>

              {/* Orbiting Nodes */}
              {microgrid.nodes?.map((node: any, index: number) => {
                const angle = (index / microgrid.nodes.length) * 2 * Math.PI;
                const radius = 200;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                const liveState = nodeStates[node.id];
                const netKw = liveState?.netPowerKw || 0;
                const isSurplus = liveState?.isSurplus ?? null;
                
                const nodeColor = isSurplus === true ? 'emerald' : isSurplus === false ? 'rose' : 'slate';
                const Icon = isSurplus === true ? ArrowUpRight : isSurplus === false ? ArrowDownRight : Activity;

                return (
                  <div 
                    key={node.id} 
                    className="absolute transition-all duration-1000"
                    style={{
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      top: '50%',
                      left: '50%'
                    }}
                  >
                    <div className="flex flex-col items-center group relative cursor-pointer">
                      <div className={`w-14 h-14 rounded-xl bg-[#111114] border border-${nodeColor === 'slate' ? '[#2d2d33]' : nodeColor + '-500/30'} flex flex-col items-center justify-center z-10 group-hover:scale-110 transition-transform shadow-lg`}>
                        <Icon size={20} className={nodeColor === 'slate' ? 'text-[#334155]' : `text-${nodeColor}-400`} />
                        {isSurplus !== null && <span className={`text-[10px] font-black text-${nodeColor}-400`}>{netKw.toFixed(1)}kW</span>}
                      </div>
                      <span className="absolute -bottom-6 whitespace-nowrap text-[10px] font-bold text-[#64748b] tracking-tight group-hover:text-white transition-colors uppercase">{node.name}</span>
                      
                      {/* Connection Line to center (SVG) */}
                      <svg className="absolute w-[450px] h-[450px] pointer-events-none -z-10" style={{
                         top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${angle}rad)`
                      }}>
                         <line 
                           x1="225" y1="225" 
                           x2="410" y2="225" 
                           stroke={isSurplus === true ? "url(#surplus-gradient)" : isSurplus === false ? "url(#deficit-gradient)" : "#1e1e24"} 
                           strokeWidth={isSurplus === null ? "1" : "2"} 
                           strokeDasharray={isSurplus === true ? "4 4" : "none"}
                           className={isSurplus === true ? "animate-flow-out" : isSurplus === false ? "animate-flow-in" : ""}
                         />
                      </svg>
                    </div>
                  </div>
                );
              })}
              
              {/* Gradients */}
              <svg width="0" height="0" className="absolute">
                <defs>
                  <linearGradient id="surplus-gradient" x1="1" y1="0" x2="0" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="deficit-gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* 2. Intelligence Sidebar (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-8">
             <div className="h-[350px]">
               <MicrogridBalanceChart />
             </div>
             <div className="flex-1 min-h-[400px]">
               <LiveTradeFeed />
             </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}

