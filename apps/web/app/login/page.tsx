"use client";

import React, { useState } from "react";
import { api } from "../../lib/api";
import { Shield, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.login({ email, password });
      window.location.href = "/";
    } catch (err: any) {
      setError("Invalid credentials. Access denied.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-info/10 text-info mb-6 border border-info/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">EnergyFlow OS</h1>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.3em]">Grid Infrastructure Auth Portal</p>
        </div>

        <div className="pro-card p-8 shadow-2xl backdrop-blur-sm bg-card-bg/80">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-critical/10 border border-critical/20 flex items-center gap-3 text-critical animate-shake">
                <AlertCircle size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Terminal ID / Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-info transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@energyflow.com"
                  className="w-full bg-[#0a0a0c] border border-card-border rounded-xl pl-12 pr-4 py-4 text-sm text-text-primary focus:outline-none focus:border-info/50 transition-all font-medium placeholder:text-text-muted/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Secure Passkey</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-info transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0a0a0c] border border-card-border rounded-xl pl-12 pr-4 py-4 text-sm text-text-primary focus:outline-none focus:border-info/50 transition-all font-medium placeholder:text-text-muted/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-info/10 hover:bg-info/20 text-info text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all border border-info/20 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-info/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center gap-3">
                {loading ? "Decrypting..." : "Access Mainframe"}
                <ArrowRight size={16} className={loading ? "hidden" : "group-hover:translate-x-1 transition-transform"} />
              </span>
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-[9px] text-text-muted font-bold uppercase tracking-widest">
          Classified Information System • Unauthorized Access Prohibited
        </p>
      </div>
    </div>
  );
}
