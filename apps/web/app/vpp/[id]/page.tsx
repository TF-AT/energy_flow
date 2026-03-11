"use client";

import { useEffect, useState, use } from "react";
import Layout from "../../../components/Layout";
import { api } from "../../../lib/api";
import { Network, ArrowLeft, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import Link from "next/link";
import Breadcrumbs from "../../../components/Breadcrumbs";

export default function MicrogridDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [microgrid, setMicrogrid] = useState<any>(null);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        
        // Use generic fetch since api layer might not have these dedicated methods yet
        const [mgRes, setRes] = await Promise.all([
          fetch(`http://localhost:3001/api/vpp/microgrids`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`http://localhost:3001/api/vpp/microgrids/${id}/settlements`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const mgData = await mgRes.json();
        const setData = await setRes.json();
        
        // Find specific microgrid
        const specificMg = mgData.data.find((m: any) => m.id === id);
        
        // For MVP frontend mapping
        // In real app, we'd hit /vpp/nodes/:id to get deep topology, but for UI visual test we construct dummy state based on names
        if (specificMg) {
          specificMg.nodes = specificMg.nodes.map((n: any) => ({
             ...n,
             currentStatus: n.name.includes('Farm') || n.name.includes('Producer') ? 'SURPLUS' : 'DEFICIT',
             netPowerKw: Math.floor(Math.random() * 50) + 10
          }));
        }

        setMicrogrid(specificMg);
        
        // Mocking settlements if backend empty for UI viewing
        const settlementsData = setData.data.length > 0 ? setData.data : [
          { nodeId: "vpp-solar-farm-1", totalEarned: 154.20, totalSpent: 0, netBalance: 154.20 },
          { nodeId: "vpp-house-2", totalEarned: 0, totalSpent: 42.10, netBalance: -42.10 },
          { nodeId: "vpp-house-3", totalEarned: 0, totalSpent: 12.50, netBalance: -12.50 },
        ];
        
        setSettlements(settlementsData);

      } catch (error) {
        console.error("Failed to fetch microgrid details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // In a real app we'd listen to WebSocket events for live topology updates
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
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
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] tracking-widest align-middle">ACTIVE</span>
              </h2>
              <p className="text-sm text-[#64748b] font-medium mt-1">{microgrid.region} • ID: {microgrid.id}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Topology Visualizer (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Network size={20} className="text-blue-400" />
                Network Topology
              </h3>
              <div className="flex gap-4 text-xs font-bold text-[#64748b]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> SURPLUS</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"></span> DEFICIT</span>
              </div>
            </div>

            <div className="bg-[#16161a] p-8 rounded-2xl border border-[#2d2d33] shadow-xl relative overflow-hidden min-h-[500px] flex items-center justify-center">
              {/* Central Hub */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                 <div className="w-24 h-24 rounded-full bg-blue-500/10 border-4 border-blue-500/30 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                   <Network size={40} className="text-blue-400" />
                 </div>
                 <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Router</span>
              </div>

              {/* Orbiting Nodes (CSS radial positioning) */}
              {microgrid.nodes?.map((node: any, index: number) => {
                const angle = (index / microgrid.nodes.length) * 2 * Math.PI;
                const radius = 180;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const isSurplus = node.currentStatus === 'SURPLUS';
                const nodeColor = isSurplus ? 'emerald' : 'rose';
                const Icon = isSurplus ? ArrowUpRight : ArrowDownRight;

                return (
                  <div 
                    key={node.id} 
                    className="absolute"
                    style={{
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      top: '50%',
                      left: '50%'
                    }}
                  >
                    <div className="flex flex-col items-center group relative cursor-pointer">
                      <div className={`w-16 h-16 rounded-2xl bg-[#1e293b] border-2 border-${nodeColor}-500/30 flex flex-col items-center justify-center z-10 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(var(--${nodeColor}-500),0.1)]`}>
                        <Icon size={24} className={`text-${nodeColor}-400`} />
                        <span className={`text-[10px] font-black text-${nodeColor}-400`}>{node.netPowerKw}kW</span>
                      </div>
                      <span className="absolute -bottom-8 whitespace-nowrap text-xs font-bold text-[#94a3b8]">{node.name}</span>
                      
                      {/* Connection Line to center (SVG) */}
                      <svg className="absolute w-[400px] h-[400px] pointer-events-none -z-10" style={{
                         top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${angle}rad)`
                      }}>
                         <line 
                           x1="200" y1="200" 
                           x2="380" y2="200" 
                           stroke={isSurplus ? "url(#surplus-gradient)" : "url(#deficit-gradient)"} 
                           strokeWidth="2" 
                           strokeDasharray={isSurplus ? "4 4" : "none"}
                           className={isSurplus ? "animate-flow-out" : "animate-flow-in"}
                         />
                      </svg>
                    </div>
                  </div>
                );
              })}
              
              {/* Global Gradients for SVG lines */}
              <svg width="0" height="0" className="absolute">
                <defs>
                  <linearGradient id="surplus-gradient" x1="1" y1="0" x2="0" y2="0">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="deficit-gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#fb7185" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Trading Ledger (1 Col) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity size={20} className="text-amber-400" />
                P2P Settlement Ledger
              </h3>
            </div>
            
            <div className="bg-[#16161a] rounded-2xl border border-[#2d2d33] overflow-hidden flex flex-col h-[500px]">
              <div className="p-4 border-b border-[#2d2d33] bg-[#1a1a20]">
                <div className="text-[10px] font-black text-[#64748b] tracking-widest uppercase">30-Day Nodal Balances</div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {settlements.map((s: any, idx) => {
                   const nodeName = microgrid.nodes?.find((n:any) => n.id === s.nodeId)?.name || s.nodeId;
                   const isPositive = s.netBalance > 0;
                   return (
                     <div key={idx} className="p-4 bg-[#111114] rounded-xl border border-[#2d2d33] flex items-center justify-between">
                       <div>
                         <div className="text-sm font-bold text-white">{nodeName}</div>
                         <div className="text-[10px] text-[#64748b] font-medium mt-1">E: ${s.totalEarned.toFixed(2)} | S: ${s.totalSpent.toFixed(2)}</div>
                       </div>
                       <div className={`text-lg font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                         {isPositive ? '+' : ''}{s.netBalance.toFixed(2)}
                       </div>
                     </div>
                   );
                 })}
                 {settlements.length === 0 && (
                   <div className="text-center text-[#64748b] text-sm py-8 font-medium">No settlements calculated yet.</div>
                 )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
