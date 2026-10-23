"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Star,
  Check,
  FileText,
  ChevronDown,
  ChevronUp,
  Bot,
  Radio,
  ExternalLink,
} from "lucide-react";
import { CallRecord, FeedbackData, LeadTier } from "@/lib/types";
import AudioPlayer from "./AudioPlayer";

interface ReviewFeedbackModalProps {
  call: CallRecord;
  isOpen: boolean;
  onClose: () => void;
  existingFeedback?: FeedbackData;
  onSaveFeedback: (feedback: FeedbackData) => void;
}

const COMMON_TAGS = [
  "Interrupted Caller",
  "Price Hallucination",
  "Kannada / Script Glitch",
  "Parent Misidentified as Kid",
  "Late Service Transfer",
  "Wrong Model Quoted",
  "Fast Call Drop",
  "High Purchase Intent",
  "Great Empathy & Flow",
];

const LEAD_TIERS: { tier: LeadTier; label: string; icon: string; color: string }[] = [
  { tier: "hot", label: "Hot Lead", icon: "🔥", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { tier: "warm", label: "Warm Lead", icon: "⚡", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { tier: "cold", label: "Cold Lead", icon: "❄️", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { tier: "kids", label: "Kids Cycle", icon: "🧒", color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  { tier: "service", label: "Service / Repair", icon: "🛠️", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { tier: "spam", label: "Spam / Wrong #", icon: "🚫", color: "bg-slate-700/50 text-slate-400 border-slate-600" },
];

export default function ReviewFeedbackModal({
  call,
  isOpen,
  onClose,
  existingFeedback,
  onSaveFeedback,
}: ReviewFeedbackModalProps) {
  const [leadTier, setLeadTier] = useState<LeadTier>(existingFeedback?.lead_tier || "warm");
  const [rating, setRating] = useState<number>(existingFeedback?.agent_rating || 4);
  const [selectedTags, setSelectedTags] = useState<string[]>(existingFeedback?.tags || []);
  const [feedbackText, setFeedbackText] = useState(
    existingFeedback?.feedback ||
      existingFeedback?.general_notes ||
      existingFeedback?.customer_query ||
      ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    if (existingFeedback) {
      setLeadTier(existingFeedback.lead_tier);
      setRating(existingFeedback.agent_rating);
      setSelectedTags(existingFeedback.tags || []);
      setFeedbackText(
        existingFeedback.feedback ||
          existingFeedback.general_notes ||
          existingFeedback.customer_query ||
          ""
      );
    }
  }, [existingFeedback]);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    const feedback: FeedbackData = {
      call_id: call.id,
      phone_number: call.from_number,
      lead_tier: leadTier,
      agent_rating: rating,
      tags: selectedTags,
      feedback: feedbackText,
      customer_query: feedbackText,
      general_notes: feedbackText,
      reviewed_at: existingFeedback?.reviewed_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reviewed_by: "Owner Review",
    };

    onSaveFeedback(feedback);
    setIsSaving(false);
    onClose();
  };

  const agentName = call.agent === "Bolna (Ananya)" ? "Ananya (Bolna)" : "AutoCall";

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
              className={`p-2 rounded-lg border text-[11px] ${
                isAssistant
                  ? "bg-purple-950/40 border-purple-800/40 text-purple-200"
                  : isUser
                  ? "bg-slate-800/60 border-slate-700 text-slate-200"
                  : "bg-slate-900 border-slate-800 text-slate-300"
              }`}
            >
              <span className="font-bold text-[9px] uppercase tracking-wider block mb-0.5 text-slate-400">
                {isAssistant ? "🤖 Ananya" : isUser ? "👤 Customer" : "Log"}
              </span>
              <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[94vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Sticky Pinned Audio Player Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/95 sticky top-0 z-20 shrink-0 space-y-2.5">
          {/* Header Row: Title, Agent Badge, Duration, Close */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-base">Review Call</span>
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
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                {call.duration_formatted}
              </span>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Caller Details & Plivo Link */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>{call.from_number}</span>
            <div className="flex items-center gap-2">
              <span>{call.date_formatted}</span>
              {call.plivo_console_url && (
                <a
                  href={call.plivo_console_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-emerald-400 flex items-center gap-0.5 text-[10px]"
                >
                  <span>Plivo Log</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>

          {/* AUDIO PLAYER PINNED AT TOP OF MODAL */}
          <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
            <AudioPlayer
              url={call.recording_url}
              durationSeconds={call.duration_seconds}
              callId={`modal-${call.id}`}
            />
          </div>

          {/* Dialogue Transcript Toggle inside Modal (for Bolna calls) */}
          {call.transcript && (
            <div>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                type="button"
                className="w-full py-1.5 px-2.5 rounded-lg bg-purple-950/40 border border-purple-800/40 text-[11px] font-semibold text-purple-300 flex items-center justify-between hover:bg-purple-900/40 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  <span>{showTranscript ? "Hide Conversation Dialogue" : "Read Ananya Conversation Dialogue"}</span>
                </span>
                {showTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showTranscript && (
                <div className="max-h-36 overflow-y-auto mt-2 p-2 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1.5">
                  {call.summary && (
                    <div className="p-1.5 rounded bg-emerald-950/30 border border-emerald-800/40 text-[10px] text-emerald-300">
                      <span className="font-bold">Summary: </span>
                      {call.summary}
                    </div>
                  )}
                  {renderTranscriptLines(call.transcript)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* 1. Lead Tier Selection (Including Kids Cycle) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">
              1. Mark Lead Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LEAD_TIERS.map(({ tier, label, icon, color }) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setLeadTier(tier)}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all active:scale-95 ${
                    leadTier === tier
                      ? `${color} ring-2 ring-emerald-500/50 font-semibold shadow-sm`
                      : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Voice AI Star Rating (Dynamic by Agent) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">
              2. Voice Agent Quality ({agentName})
            </label>
            <div className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none transition-transform active:scale-125"
                >
                  <Star
                    className={`w-6 h-6 sm:w-7 sm:h-7 ${
                      star <= rating
                        ? "text-amber-400 fill-amber-400 drop-shadow"
                        : "text-slate-700 hover:text-slate-600"
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-semibold text-amber-300 ml-2">
                {rating === 5 && "⭐ Flawless Call"}
                {rating === 4 && "⭐ Good Call"}
                {rating === 3 && "⭐ Needs Polish"}
                {rating === 2 && "⚠️ Clashes / Glitches"}
                {rating === 1 && "🚨 Critical Failure"}
              </span>
            </div>
          </div>

          {/* 3. Quick QA Tags */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">
              3. Voice QA & Behavior Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 active:scale-95 ${
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold"
                        : "bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Single Feedback Box (Replaced 3 boxes) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
              4. Feedback & Notes
            </label>
            <textarea
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Type your feedback here (e.g. Customer asking for 20-inch kids cycle with gear; agent quoted wrong price; follow up on WhatsApp with catalog)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-950/90 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Save Feedback & Mark Lead</span>
          </button>
        </div>
      </div>
    </div>
  );
}
