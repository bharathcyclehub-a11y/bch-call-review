"use client";

import React from "react";
import { PhoneCall, Users, Clock, CheckCircle2 } from "lucide-react";

interface StatsSummaryProps {
  totalCalls: number;
  totalMinutes: number;
  uniqueCallers: number;
  reviewedCount: number;
}

export default function StatsSummary({
  totalCalls,
  totalMinutes,
  uniqueCallers,
  reviewedCount,
}: StatsSummaryProps) {
  const hours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
          <span>Total Calls</span>
        </div>
        <p className="text-xl font-bold font-mono text-white">{totalCalls}</p>
        <span className="text-[10px] text-slate-500">Auto-call line 1614</span>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Talk Time</span>
        </div>
        <p className="text-xl font-bold font-mono text-white">{hours} hrs</p>
        <span className="text-[10px] text-slate-500">{Math.round(totalMinutes)} minutes total</span>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <span>Unique Callers</span>
        </div>
        <p className="text-xl font-bold font-mono text-white">{uniqueCallers}</p>
        <span className="text-[10px] text-slate-500">Grouped by phone</span>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Reviewed</span>
        </div>
        <p className="text-xl font-bold font-mono text-white">{reviewedCount}</p>
        <span className="text-[10px] text-slate-500">
          {totalCalls > 0 ? `${Math.round((reviewedCount / totalCalls) * 100)}% reviewed` : "0%"}
        </span>
      </div>
    </div>
  );
}
