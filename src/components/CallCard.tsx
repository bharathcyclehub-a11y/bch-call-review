"use client";

import React, { useState } from "react";
import {
  Phone,
  MessageCircle,
  Edit3,
  CheckCheck,
  Copy,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Bot,
  Radio,
  Check,
  X,
  Hash,
} from "lucide-react";
import { CallRecord, FeedbackData, LeadTier } from "@/lib/types";
import AudioPlayer from "./AudioPlayer";

interface CallCardProps {
  call: CallRecord;
  rank?: number;
  feedback?: FeedbackData;
  onSaveFeedback?: (feedback: FeedbackData) => void;
}

export default function CallCard({ call, rank, feedback, onSaveFeedback }: CallCardProps) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedLeadId, setCopiedLeadId] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Inline Review Form State
  const [leadTier, setLeadTier] = useState<LeadTier>(
    (feedback?.lead_tier as LeadTier) || "warm"
  );
  const [feedbackText, setFeedbackText] = useState(
    feedback?.feedback || feedback?.general_notes || feedback?.customer_query || ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const cleanPhone = call.from_number.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${cleanPhone}?text=Hello!%20Thank%20you%20for%20contacting%20Bharath%20Cycle%20Hub.%20How%20can%20we%20assist%20you%20today?`;

  const copyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(call.from_number);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const copyLeadId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(call.lead_id);
    setCopiedLeadId(true);
    setTimeout(() => setCopiedLeadId(false), 2000);
  };

  const handleInlineSave = async () => {
    if (!onSaveFeedback) return;
    setIsSaving(true);
    const updatedFeedback: FeedbackData = {
      call_id: call.id,
      phone_number: call.from_number,
      lead_tier: leadTier,
      feedback: feedbackText,
      customer_query: feedbackText,
      general_notes: feedbackText,
      reviewed_at: feedback?.reviewed_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reviewed_by: "Owner Review",
    };

    await onSaveFeedback(updatedFeedback);
    setIsSaving(false);
    setIsReviewOpen(false);
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "hot":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">🔥 Hot</span>;
      case "warm":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">⚡ Warm</span>;
      case "cold":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">❄️ Cold</span>;
      default:
        return null;
    }
  };

  const renderTranscriptLines = (transcript: string) => {
    const lines = transcript.split("\n").filter((l) => l.trim().length > 0);
    return (
      <div className="space-y-1.5 text-xs">
        {lines.map((line, idx) => {
          const isAssistant = line.toLowerCase().startsWith("assistant:") || line.toLowerCase().startsWith("agent:");
          const isUser = line.toLowerCase().startsWith("user:") || line.toLowerCase().startsWith("customer:");
          const content = line.replace(/^(assistant|agent|user|customer):\s*/i, "").trim();

          if (!content) return null;

          return (
            <div
              key={idx}
              className={`p-2 rounded-xl border text-[11px] ${
                isAssistant
                  ? "bg-purple-950/30 border-purple-800/40 text-purple-200 ml-2"
                  : isUser
                  ? "bg-slate-800/60 border-slate-700 text-slate-200 mr-2"
                  : "bg-slate-900 border-slate-800 text-slate-300"
              }`}
            >
              <span className="font-semibold text-[9px] uppercase tracking-wider block mb-0.5 text-slate-400">
                {isAssistant ? "🤖 Ananya" : isUser ? "👤 Customer" : "Log"}
              </span>
              <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
            </div>
          );
        })}
      </div>
    );
  };

  const currentFeedbackNote = feedback?.feedback || feedback?.general_notes || feedback?.customer_query;

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col gap-3 transition-colors">
      {/* Top Header: 4-digit Lead ID, Phone Number, Time, Agent Badge, Duration */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {rank !== undefined && (
            <span className="h-6 min-w-6 px-1.5 rounded-md bg-slate-800 text-slate-400 font-mono text-xs font-bold flex items-center justify-center">
              #{rank}
            </span>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* 4-digit Lead ID with 1-click copy */}
              <button
                type="button"
                onClick={copyLeadId}
                className="px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-mono text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                title="Click to copy Lead ID for Chetan"
              >
                <span>{call.lead_id}</span>
                {copiedLeadId ? (
                  <CheckCheck className="w-3 h-3 text-emerald-300" />
                ) : (
                  <Copy className="w-3 h-3 opacity-70" />
                )}
              </button>

              <div className="flex items-center gap-1">
                <span className="font-mono font-semibold text-white text-sm sm:text-base">
                  {call.from_number}
                </span>
                <button
                  onClick={copyPhone}
                  type="button"
                  className="text-slate-500 hover:text-slate-300 p-0.5 transition-colors"
                  title="Copy Phone Number"
                >
                  {copiedPhone ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
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

        <div className="flex flex-col items-end gap-1 shrink-0">
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

      {/* Review Snapshot (if already reviewed and not currently editing) */}
      {feedback && !isReviewOpen && currentFeedbackNote && (
        <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 text-xs flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Feedback Saved
            </span>
            {feedback.reviewed_at && (
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date(feedback.reviewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <p className="text-slate-300 leading-relaxed">{currentFeedbackNote}</p>
        </div>
      )}

      {/* INLINE REVIEW PANEL (Opens right at the bottom on the SAME screen!) */}
      {isReviewOpen && (
        <div className="bg-slate-950/95 rounded-2xl p-3.5 border border-slate-800 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Review Lead</span>
              <span className="text-emerald-400 font-mono text-xs">({call.lead_id})</span>
            </span>
            <button
              onClick={() => setIsReviewOpen(false)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lead Status: ONLY 3 OPTIONS (Hot, Warm, Cold) */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              1. Mark Lead:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLeadTier("hot")}
                className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  leadTier === "hot"
                    ? "bg-red-500/20 text-red-300 border-red-500 ring-2 ring-red-500/40 shadow-sm"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>🔥 Hot</span>
              </button>

              <button
                type="button"
                onClick={() => setLeadTier("warm")}
                className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  leadTier === "warm"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500 ring-2 ring-amber-500/40 shadow-sm"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>⚡ Warm</span>
              </button>

              <button
                type="button"
                onClick={() => setLeadTier("cold")}
                className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  leadTier === "cold"
                    ? "bg-blue-500/20 text-blue-300 border-blue-500 ring-2 ring-blue-500/40 shadow-sm"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>❄️ Cold</span>
              </button>
            </div>
          </div>

          {/* Single Feedback Textbox */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              2. Feedback:
            </label>
            <textarea
              rows={3}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Type your feedback here (e.g. customer interested in gear cycle, budget 15k, call back tomorrow)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsReviewOpen(false)}
              className="py-2 px-3 rounded-xl border border-slate-800 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleInlineSave}
              disabled={isSaving}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 active:scale-95 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Lead & Feedback</span>
            </button>
          </div>
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
          onClick={() => setIsReviewOpen(!isReviewOpen)}
          type="button"
          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
            isReviewOpen
              ? "bg-slate-800 text-white border-slate-700"
              : "bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/30"
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{feedback ? "Edit Lead" : "Review Lead"}</span>
        </button>
      </div>
    </div>
  );
}
