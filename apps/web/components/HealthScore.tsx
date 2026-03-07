import React from "react";
import { Activity } from "lucide-react";

interface HealthScoreProps {
  score: number;
}

export default function HealthScore({ score }: HealthScoreProps) {
  let colorClass = "text-success border-success/30 bg-success/5";
  let ringColor = "stroke-success";
  
  if (score < 70) {
    colorClass = "text-critical border-critical/30 bg-critical/5";
    ringColor = "stroke-critical";
  } else if (score < 90) {
    colorClass = "text-warning border-warning/30 bg-warning/5";
    ringColor = "stroke-warning";
  }

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border ${colorClass} transition-all duration-700`}>
      <div className="relative h-16 w-16">
        <svg className="h-full w-full rotate-[-90deg]">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="opacity-10"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1s ease-in-out' }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity size={20} className="opacity-50" />
        </div>
      </div>
      
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Grid Health</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black tracking-tighter">{score}</span>
          <span className="text-sm font-bold opacity-60">%</span>
        </div>
      </div>
    </div>
  );
}
