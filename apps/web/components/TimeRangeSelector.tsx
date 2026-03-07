import React from "react";
import { Clock } from "lucide-react";

export type TimeRange = 1 | 5 | 30 | 60;

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

export default function TimeRangeSelector({ selectedRange, onRangeChange }: TimeRangeSelectorProps) {
  const ranges: { label: string; value: TimeRange }[] = [
    { label: "1 MIN", value: 1 },
    { label: "5 MIN", value: 5 },
    { label: "30 MIN", value: 30 },
    { label: "1 HOUR", value: 60 },
  ];

  return (
    <div className="flex items-center gap-2 bg-[#16161a] border border-[#2d2d33] p-1.5 rounded-xl">
      <div className="px-3 border-r border-[#2d2d33] flex items-center gap-2 mr-1">
        <Clock size={12} className="text-[#64748b]" />
        <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">History</span>
      </div>
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onRangeChange(range.value)}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            selectedRange === range.value
              ? "bg-info text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              : "text-[#64748b] hover:bg-[#1e293b] hover:text-[#94a3b8]"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
