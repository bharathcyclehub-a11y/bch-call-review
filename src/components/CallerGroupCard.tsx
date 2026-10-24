"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Phone, MessageCircle, Clock, Volume2, ShieldAlert } from "lucide-react";
import { CallerGroup, CallRecord, FeedbackData } from "@/lib/types";
import CallCard from "./CallCard";

interface CallerGroupCardProps {
  group: CallerGroup;
  rank: number;
  feedbackMap: Record<string, FeedbackData>;
  onSaveFeedback?: (feedback: FeedbackData) => void;
}

export default function CallerGroupCard({
  group,
  rank,
  feedbackMap,
  onSaveFeedback,
}: CallerGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(rank <= 3); // Top 3 expanded by default

  const cleanPhone = group.phone_number.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${cleanPhone}?text=Hello!%20Thank%20you%20for%20contacting%20Bharath%20Cycle%20Hub.%20How%20can%20we%20assist%20you%20today?`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all">
      {/* Group Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 cursor-pointer hover:bg-slate-800/40 flex items-center justify-between gap-3 select-none"
      >
        <div className="flex items-center gap-3">
          <span
            className={`h-7 w-7 rounded-lg text-xs font-bold flex items-center justify-center font-mono ${
              group.total_calls >= 10
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : group.total_calls >= 5
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            #{rank}
          </span>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white text-base">
                {group.phone_number}
              </span>
              {group.total_calls >= 10 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Urgent
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1 font-medium">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Volume2 className="w-3.5 h-3.5" />
                {group.total_calls} calls
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {group.total_duration_formatted} total
              </span>
              <span className="text-slate-500">Max: {group.max_duration_formatted}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
            title="Chat on WhatsApp"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
          </a>

          <a
            href={`tel:${group.phone_number}`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Call"
          >
            <Phone className="w-4 h-4" />
          </a>

          <div className="p-1 text-slate-400">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Expanded Calls List */}
      {isExpanded && (
        <div className="p-3 sm:p-4 bg-slate-950/60 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>All {group.calls.length} Call Recordings for this number:</span>
            <span>Latest: {group.last_call_time}</span>
          </div>

          {group.calls.map((call, idx) => (
            <CallCard
              key={call.id}
              call={call}
              rank={idx + 1}
              feedback={feedbackMap[call.id]}
              onSaveFeedback={onSaveFeedback}
            />
          ))}
        </div>
      )}
    </div>
  );
}
