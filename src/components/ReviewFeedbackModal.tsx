"use client";

import React, { useState, useEffect } from "react";
import { X, Star, Check, Sparkles, MessageSquare, AlertCircle } from "lucide-react";
import { CallRecord, FeedbackData, LeadTier } from "@/lib/types";

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
  const [customerQuery, setCustomerQuery] = useState(existingFeedback?.customer_query || "");
  const [agentResponseNotes, setAgentResponseNotes] = useState(existingFeedback?.agent_response_notes || "");
  const [generalNotes, setGeneralNotes] = useState(existingFeedback?.general_notes || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existingFeedback) {
      setLeadTier(existingFeedback.lead_tier);
      setRating(existingFeedback.agent_rating);
      setSelectedTags(existingFeedback.tags || []);
      setCustomerQuery(existingFeedback.customer_query || "");
      setAgentResponseNotes(existingFeedback.agent_response_notes || "");
      setGeneralNotes(existingFeedback.general_notes || "");
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
      customer_query: customerQuery,
      agent_response_notes: agentResponseNotes,
      general_notes: generalNotes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: "Owner Review",
    };

    onSaveFeedback(feedback);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-base">Review Call</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                {call.duration_formatted}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{call.from_number}</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* 1. Lead Tier Selection */}
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

          {/* 2. Voice AI Star Rating */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">
              2. Voice Agent Quality (Ananya)
            </label>
            <div className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1.5 focus:outline-none transition-transform active:scale-125"
                >
                  <Star
                    className={`w-7 h-7 ${
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

          {/* 4. What did customer ask? */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              What did the customer ask?
            </label>
            <input
              type="text"
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
              placeholder="e.g. EMotorad Viper Rs.999 EMI, delivery to Mysore, kids cycle..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* 5. What did Ananya say / Retraining notes */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              What did the agent say / Retraining note?
            </label>
            <textarea
              rows={2}
              value={agentResponseNotes}
              onChange={(e) => setAgentResponseNotes(e.target.value)}
              placeholder="e.g. She quoted Rs.75,000 correctly but interrupted the caller twice when they paused..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* 6. General Feedback */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Reviewer Action / Next Steps
            </label>
            <input
              type="text"
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="e.g. Send WhatsApp catalog; Sales manager to call tomorrow morning"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-950/80 shrink-0">
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
