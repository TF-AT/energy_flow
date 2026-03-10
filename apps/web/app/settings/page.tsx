"use client";

import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { User, Bell, Info, Save, Shield, Cpu, Activity, Mail, MapPin, Hash } from "lucide-react";
import { api } from "../../lib/api";

interface ProfileState {
  name: string;
  id: string;
  location: string;
  email: string;
}

interface AlertState {
  highVoltage: number;
  lowVoltage: number;
  frequency: number;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileState>({
    name: "John Doe",
    id: "OPT-014-LGS",
    location: "Lagos Island Hub (Zone A)",
    email: "j.doe@energyflow.com"
  });

  const [alerts, setAlerts] = useState<AlertState>({
    highVoltage: 250,
    lowVoltage: 190,
    frequency: 1
  });

  const [fetchedRules, setFetchedRules] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getAlertRules().then(rules => {
      setFetchedRules(rules);
      const hvRule = rules.find(r => r.metric === 'voltage' && r.condition === 'GREATER_THAN');
      const lvRule = rules.find(r => r.metric === 'voltage' && r.condition === 'LESS_THAN');
      const freqRule = rules.find(r => r.metric === 'frequency');

      setAlerts({
        highVoltage: hvRule?.criticalThreshold || 250,
        lowVoltage: lvRule?.criticalThreshold || 190,
        frequency: freqRule?.criticalThreshold ? freqRule.criticalThreshold - 50 : 1
      });
    }).catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const hvRule = fetchedRules.find(r => r.metric === 'voltage' && r.condition === 'GREATER_THAN');
      if (hvRule) {
        await api.updateAlertRule(hvRule.id, { criticalThreshold: alerts.highVoltage });
      } else {
        await api.createAlertRule({ deviceType: 'transformer', metric: 'voltage', condition: 'GREATER_THAN', criticalThreshold: alerts.highVoltage, warningThreshold: alerts.highVoltage - 10 });
      }

      const lvRule = fetchedRules.find(r => r.metric === 'voltage' && r.condition === 'LESS_THAN');
      if (lvRule) {
        await api.updateAlertRule(lvRule.id, { criticalThreshold: alerts.lowVoltage });
      } else {
        await api.createAlertRule({ deviceType: 'transformer', metric: 'voltage', condition: 'LESS_THAN', criticalThreshold: alerts.lowVoltage, warningThreshold: alerts.lowVoltage + 10 });
      }

      const freqRule = fetchedRules.find(r => r.metric === 'frequency');
      if (freqRule) {
        await api.updateAlertRule(freqRule.id, { criticalThreshold: 50 + alerts.frequency });
      } else {
        await api.createAlertRule({ deviceType: 'transformer', metric: 'frequency', condition: 'GREATER_THAN', criticalThreshold: 50 + alerts.frequency });
      }

      const updatedRules = await api.getAlertRules();
      setFetchedRules(updatedRules);
      alert("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-[1000px] mx-auto space-y-8">
        <header className="mb-10">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">System Configuration</h2>
          <p className="text-xs text-text-muted font-bold uppercase tracking-[0.2em] mt-1">
            EnergyFlow OS • Global Parametric Controls
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section 1: Operator Profile */}
          <div className="pro-card p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-card-border">
              <div className="p-2 rounded-lg bg-info/10 text-info">
                <User size={18} />
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Operator Profile</h3>
            </div>

            <div className="space-y-4">
              <SettingsInput 
                icon={<User size={14} />} 
                label="Full Name" 
                value={profile.name} 
                onChange={(v) => setProfile({ ...profile, name: v })} 
              />
              <SettingsInput 
                icon={<Hash size={14} />} 
                label="Operator ID" 
                value={profile.id} 
                readOnly
              />
              <SettingsInput 
                icon={<MapPin size={14} />} 
                label="Station Location" 
                value={profile.location} 
                onChange={(v) => setProfile({ ...profile, location: v })} 
              />
              <SettingsInput 
                icon={<Mail size={14} />} 
                label="Contact Email" 
                value={profile.email} 
                onChange={(v) => setProfile({ ...profile, email: v })} 
              />
            </div>

            <button 
              onClick={handleSave}
              className="w-full py-3 rounded-xl bg-info/10 hover:bg-info/20 text-info text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-info/20"
            >
              <Save size={14} className={saving ? "animate-spin" : ""} />
              {saving ? "Updating..." : "Persist Changes"}
            </button>
          </div>

          {/* Section 2: Alert Preferences */}
          <div className="pro-card p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-card-border">
              <div className="p-2 rounded-lg bg-warning/10 text-warning">
                <Bell size={18} />
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Alert Preferences</h3>
            </div>

            <div className="space-y-4">
              <SettingsInput 
                icon={<Shield size={14} />} 
                label="Over-Voltage Threshold (V)" 
                type="number"
                value={alerts.highVoltage.toString()} 
                onChange={(v) => setAlerts({ ...alerts, highVoltage: Number(v) })} 
              />
              <SettingsInput 
                icon={<Shield size={14} />} 
                label="Under-Voltage Threshold (V)" 
                type="number"
                value={alerts.lowVoltage.toString()} 
                onChange={(v) => setAlerts({ ...alerts, lowVoltage: Number(v) })} 
              />
              <SettingsInput 
                icon={<Activity size={14} />} 
                label="Frequency Deviation (±Hz)" 
                type="number"
                step="0.1"
                value={alerts.frequency.toString()} 
                onChange={(v) => setAlerts({ ...alerts, frequency: Number(v) })} 
              />
            </div>

            <div className="p-4 rounded-xl bg-warning/[0.03] border border-warning/10 text-[10px] text-warning font-bold leading-relaxed uppercase tracking-wider">
              Note: These thresholds trigger real-time notifications across all distribution hubs. Changes are logged for audit.
            </div>
          </div>
        </div>

        {/* Section 3: System Information (Read-only) */}
        <div className="pro-card p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-card-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <Info size={18} />
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest">System Information</h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/30">
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[9px] font-black text-success uppercase tracking-widest text-center">API Stable</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <ReadOnlyStat icon={<Cpu size={16} />} label="OS Version" value="EnergyFlow v2.0.4-LTS" />
            <ReadOnlyStat icon={<Activity size={16} />} label="Environment" value="Production Mainnet" />
            <ReadOnlyStat icon={<Shield size={16} />} label="Audit Level" value="Level 4 (High Integrity)" />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function SettingsInput({ 
  icon, 
  label, 
  value, 
  onChange, 
  type = "text", 
  readOnly = false,
  step
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  onChange?: (v: string) => void; 
  type?: string;
  readOnly?: boolean;
  step?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
        {icon}
        {label}
      </label>
      <input 
        type={type}
        step={step}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full bg-[#0a0a0c] border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-info/50 transition-colors font-medium ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  );
}

function ReadOnlyStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
        {icon}
        {label}
      </div>
      <div className="text-sm font-bold text-text-primary">{value}</div>
    </div>
  );
}
