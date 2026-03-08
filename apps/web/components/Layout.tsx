import React from "react";
import Link from "next/link";
import { LayoutDashboard, Server, AlertTriangle, Settings, LogOut } from "lucide-react";
import Cookies from "js-cookie";

import { useGridStatus } from "../context/GridStatusContext";

export type GridStatus = "nominal" | "warning" | "critical";

export default function Layout({ 
  children
}: { 
  children: React.ReactNode;
}) {
  const { status } = useGridStatus();
  
  const statusConfig = {
    nominal: { color: "text-emerald-400", label: "NOMINAL" },
    warning: { color: "text-warning", label: "WARNING" },
    critical: { color: "text-critical", label: "CRITICAL" },
  };

  const { color, label } = statusConfig[status];

  const handleLogout = () => {
    Cookies.remove("auth_token");
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0b] text-[#f8fafc]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#2d2d33] bg-[#111114] flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-[#2d2d33]">
          <h1 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            ENERGYFLOW OS
          </h1>
          <p className="text-[10px] text-[#64748b] font-bold tracking-widest mt-1">NIGERIA GRID v2.0</p>
        </div>

        <nav className="flex-grow p-4 space-y-2">
          <NavLink href="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <NavLink href="/transformers" icon={<Server size={18} />} label="Transformers" />
          <NavLink href="/alerts" icon={<AlertTriangle size={18} />} label="Alerts" />
        </nav>

        <div className="p-4 border-t border-[#2d2d33] space-y-2">
          <NavLink href="/settings" icon={<Settings size={18} />} label="Settings" />
          <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto">
        <header className="h-16 border-b border-[#2d2d33] bg-[#0a0a0b]/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
          <div className="text-sm font-bold text-[#64748b]">
            <span className={`${color} mr-2 transition-colors duration-500`}>●</span> 
            GRID STATUS: <span className={`${color} transition-colors duration-500`}>{label}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 border border-[#2d2d33]" />
            <div className="text-xs">
              <div className="font-bold">Operator #014</div>
              <div className="text-[#64748b]">Lagos Island Hub</div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#94a3b8] hover:text-white hover:bg-white/5 rounded-xl transition-all group"
    >
      <span className="group-hover:text-blue-400 transition-colors">{icon}</span>
      {label}
    </Link>
  );
}
