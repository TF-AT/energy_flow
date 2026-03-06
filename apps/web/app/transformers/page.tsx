"use client";

import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import TransformerCard from "../../components/TransformerCard";
import { api } from "../../lib/api";
import { Transformer } from "../../lib/types";
import { usePolling } from "../../lib/hooks";
import { Server, Search } from "lucide-react";

export default function TransformersPage() {
  const [transformers, setTransformers] = useState<Transformer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await api.getTransformers();
      setTransformers(data);
    } catch (error) {
      console.error("Failed to fetch transformers:", error);
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
            <h2 className="text-2xl font-black text-text-primary">Grid Infrastructure</h2>
            <p className="text-sm text-text-muted font-medium">Monitoring {transformers.length} active transformers across the grid.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search by ID or Location..." 
              className="w-full bg-card-bg border border-card-border rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:border-info/50 outline-none transition-all text-text-primary"
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
            {transformers.map((t) => (
              <TransformerCard key={t.id} transformer={t} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
