"use client";

import React from "react";
import { PhoneCall, Clock, CheckCircle2, AlertCircle, Bot, Radio } from "lucide-react";

interface StatsSummaryProps {
  totalCalls: number;
  pendingCount: number;
  reviewedCount: number;
  totalMinutes: number;
  bolnaCount?: number;
  autoCallCount?: number;
}

export default function StatsSummary({
  totalCalls,
  pendingCount,
  reviewedCount,
  totalMinutes,
  bolnaCount = 500,
  autoCallCount = 612,
}: StatsSummaryProps) {
  const hours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Calls */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
            <span>Total Calls</span>
          </div>
          <p className="text-xl font-bold font-mono text-white">{totalCalls}</p>
          <span className="text-[10px] text-slate-500">Reviewable audio/text</span>
        </div>

        {/* Pending Review Task Queue */}
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Pending Review</span>
          </div>
          <p className="text-xl font-bold font-mono text-amber-300">{pendingCount}</p>
          <span className="text-[10px] text-amber-400/70">Task queue to clear</span>
        </div>

        {/* Reviewed Completed */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Reviewed</span>
          </div>
          <p className="text-xl font-bold font-mono text-white">{reviewedCount}</p>
          <span className="text-[10px] text-slate-500">
            {totalCalls > 0 ? `${((reviewedCount / totalCalls) * 100).toFixed(1)}% completed` : "0%"}
          </span>
        </div>

        {/* Talk Time */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Talk Time</span>
          </div>
          <p className="text-xl font-bold font-mono text-white">{hours} hrs</p>
          <span className="text-[10px] text-slate-500">{Math.round(totalMinutes)} mins total</span>
        </div>
      </div>

      {/* Agent Counts Breakdown Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/50 border border-slate-800/80 rounded-xl text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          <span className="text-slate-300 font-medium">Bolna (Ananya):</span>
          <span className="font-mono font-bold text-white">{bolnaCount} calls</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
          <span className="text-slate-300 font-medium">AutoCall:</span>
          <span className="font-mono font-bold text-white">{autoCallCount} calls</span>
        </span>
      </div>
    </div>
  );
}
