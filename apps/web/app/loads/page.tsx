"use client";

import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import LoadCard from "../../components/LoadCard";
import { api } from "../../lib/api";
import { EnergyLoad } from "../../lib/types";
import { usePolling } from "../../lib/hooks";
import { Activity, Search } from "lucide-react";

export default function LoadsPage() {
  const [loads, setLoads] = useState<EnergyLoad[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await api.getLoads();
      setLoads(data);
    } catch (error) {
      console.error("Failed to fetch energy loads:", error);
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
            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Load Centers</h2>
            <p className="text-sm text-text-muted font-medium">Monitoring {loads.length} demand nodes in the network.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search Load ID..." 
              className="w-full bg-card-bg border border-card-border rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:border-blue-500/50 outline-none transition-all text-text-primary"
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
            {loads.map((l) => (
              <LoadCard key={l.id} load={l} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
