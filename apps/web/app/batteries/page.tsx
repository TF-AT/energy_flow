"use client";

import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import BatteryCard from "../../components/BatteryCard";
import { api } from "../../lib/api";
import { BatteryStorage } from "../../lib/types";
import { usePolling } from "../../lib/hooks";
import { Battery, Search } from "lucide-react";

export default function BatteriesPage() {
  const [batteries, setBatteries] = useState<BatteryStorage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await api.getBatteries();
      setBatteries(data);
    } catch (error) {
      console.error("Failed to fetch batteries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  usePolling(fetchData, 10000);

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Energy Storage</h2>
            <p className="text-sm text-text-muted font-medium">Monitoring {batteries.length} battery banks and BESS units.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search Bank ID..." 
              className="w-full bg-card-bg border border-card-border rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:border-emerald-500/50 outline-none transition-all text-text-primary"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-card-bg animate-pulse rounded-2xl border border-card-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batteries.map((b) => (
              <BatteryCard key={b.id} battery={b} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
