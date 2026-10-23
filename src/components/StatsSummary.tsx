"use client";

import React from "react";
import { PhoneCall, Users, Clock, CheckCircle2, Bot, Radio } from "lucide-react";

interface StatsSummaryProps {
  totalCalls: number;
  totalMinutes: number;
  uniqueCallers: number;
  reviewedCount: number;
  bolnaCount?: number;
  autoCallCount?: number;
}

export default function StatsSummary({
  totalCalls,
  totalMinutes,
  uniqueCallers,
  reviewedCount,
  bolnaCount = 500,
  autoCallCount = 612,
}: StatsSummaryProps) {
  const hours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
            <span>Total Calls</span>
          </div>
          <p className="text-xl font-bold font-mono text-white">{totalCalls}</p>
          <span className="text-[10px] text-slate-500">Reviewable audio/text</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Talk Time</span>
          </div>
          <p className="text-xl font-bold font-mono text-white">{hours} hrs</p>
          <span className="text-[10px] text-slate-500">{Math.round(totalMinutes)} mins total</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Unique Callers</span>
          </div>
          <p className="text-xl font-bold font-mono text-white">{uniqueCallers}</p>
          <span className="text-[10px] text-slate-500">Grouped numbers</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Reviewed</span>
          </div>
          <p className="text-xl font-bold font-mono text-white">{reviewedCount}</p>
          <span className="text-[10px] text-slate-500">
            {totalCalls > 0 ? `${Math.round((reviewedCount / totalCalls) * 100)}% done` : "0%"}
          </span>
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
