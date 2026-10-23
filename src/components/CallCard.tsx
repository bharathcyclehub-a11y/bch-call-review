"use client";

import React, { useState } from "react";
import {
  Phone,
  MessageCircle,
  Edit3,
  Star,
  CheckCheck,
  Copy,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Bot,
  Radio,
} from "lucide-react";
import { CallRecord, FeedbackData } from "@/lib/types";
import AudioPlayer from "./AudioPlayer";

interface CallCardProps {
  call: CallRecord;
  rank?: number;
  feedback?: FeedbackData;
  onOpenReview: (call: CallRecord) => void;
}

export default function CallCard({ call, rank, feedback, onOpenReview }: CallCardProps) {
  const [copied, setCopied] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const cleanPhone = call.from_number.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${cleanPhone}?text=Hello!%20Thank%20you%20for%20contacting%20Bharath%20Cycle%20Hub.%20How%20can%20we%20assist%20you%20today?`;

  const copyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(call.from_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "hot":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30">🔥 Hot Lead</span>;
      case "warm":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">⚡ Warm Lead</span>;
      case "cold":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">❄️ Cold Lead</span>;
      case "service":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">🛠️ Service/Repair</span>;
      case "spam":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-700/50 text-slate-400 border border-slate-600">🚫 Spam</span>;
      default:
        return null;
    }
  };

  // Helper to render readable transcript dialogue
  const renderTranscriptLines = (transcript: string) => {
    const lines = transcript.split("\n").filter((l) => l.trim().length > 0);
    return (
      <div className="space-y-2 text-xs">
        {lines.map((line, idx) => {
          const isAssistant = line.toLowerCase().startsWith("assistant:") || line.toLowerCase().startsWith("agent:");
          const isUser = line.toLowerCase().startsWith("user:") || line.toLowerCase().startsWith("customer:");
          const content = line.replace(/^(assistant|agent|user|customer):\s*/i, "").trim();

          if (!content) return null;

          return (
            <div
              key={idx}
              className={`p-2 rounded-xl border ${
                isAssistant
                  ? "bg-purple-950/30 border-purple-800/40 text-purple-200 ml-2"
                  : isUser
                  ? "bg-slate-800/60 border-slate-700 text-slate-200 mr-2"
                  : "bg-slate-900 border-slate-800 text-slate-300"
              }`}
            >
              <span className="font-semibold text-[10px] uppercase tracking-wider block mb-0.5 text-slate-400">
                {isAssistant ? "🤖 Ananya (BCH)" : isUser ? "👤 Customer" : "Log"}
              </span>
              <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col gap-3 transition-colors">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {rank !== undefined && (
            <span className="h-6 min-w-6 px-1.5 rounded-md bg-slate-800 text-slate-400 font-mono text-xs font-bold flex items-center justify-center">
              #{rank}
            </span>
          )}
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono font-semibold text-white text-sm sm:text-base">
                {call.from_number}
              </span>
              <button
                onClick={copyPhone}
                type="button"
                className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                title="Copy Number"
              >
                {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-medium">
              <span>{call.date_formatted}</span>
              {call.plivo_console_url && (
                <a
                  href={call.plivo_console_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-emerald-400 flex items-center gap-0.5 font-mono text-[10px]"
                  title="Open Plivo Console Log"
                >
                  <span>Plivo Log</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            {call.agent === "Bolna (Ananya)" ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Bot className="w-3 h-3 text-purple-400" />
                Bolna
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                <Radio className="w-3 h-3 text-sky-400" />
                AutoCall
              </span>
            )}

            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {call.duration_formatted}
            </span>
          </div>

          {feedback && getTierBadge(feedback.lead_tier)}
        </div>
      </div>

      {/* Embedded Audio Player */}
      <AudioPlayer
        url={call.recording_url}
        durationSeconds={call.duration_seconds}
        callId={call.id}
      />

      {/* Transcript Drawer Toggle for Bolna Calls */}
      {call.transcript && (
        <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 overflow-hidden">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            type="button"
            className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-1.5 text-purple-300">
              <FileText className="w-3.5 h-3.5" />
              <span>{showTranscript ? "Hide Conversation Transcript" : "View Ananya Conversation Transcript"}</span>
            </span>
            {showTranscript ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {showTranscript && (
            <div className="p-3 border-t border-slate-800/80 space-y-2.5">
              {call.summary && (
                <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-[11px] text-emerald-300">
                  <span className="font-bold block mb-0.5">Call Summary:</span>
                  <p>{call.summary}</p>
                </div>
              )}
              {renderTranscriptLines(call.transcript)}
            </div>
          )}
        </div>
      )}

      {/* Review Snapshot (if already reviewed) */}
      {feedback && (
        <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 text-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(feedback.agent_rating)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" />
              ))}
              <span className="text-[11px] text-slate-400 ml-1">Rating</span>
            </div>
            {feedback.tags && feedback.tags.length > 0 && (
              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                {feedback.tags[0]}
                {feedback.tags.length > 1 ? ` +${feedback.tags.length - 1}` : ""}
              </span>
            )}
          </div>
          {feedback.customer_query && (
            <p className="text-slate-300 line-clamp-1">
              <span className="text-slate-400 font-semibold">Asked:</span> {feedback.customer_query}
            </p>
          )}
          {feedback.agent_response_notes && (
            <p className="text-emerald-400/90 line-clamp-1">
              <span className="text-slate-400 font-semibold">Fix:</span> {feedback.agent_response_notes}
            </p>
          )}
        </div>
      )}

      {/* Quick Actions Row */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-current" />
          <span>WhatsApp</span>
        </a>

        <a
          href={`tel:${call.from_number}`}
          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Call</span>
        </a>

        <button
          onClick={() => onOpenReview(call)}
          type="button"
          className="flex-1 py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{feedback ? "Edit Review" : "Review Lead"}</span>
        </button>
      </div>
    </div>
  );
}
