"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  PhoneCall,
  Search,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  Clock,
  Users,
  Download,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { CallRecord, CallerGroup, CallsApiResponse, FeedbackData, LeadTier } from "@/lib/types";
import StatsSummary from "@/components/StatsSummary";
import CallCard from "@/components/CallCard";
import CallerGroupCard from "@/components/CallerGroupCard";
import ReviewFeedbackModal from "@/components/ReviewFeedbackModal";

type ActiveTab = "longest" | "repeat" | "recent" | "reviewed";

export default function HomePage() {
  const [data, setData] = useState<CallsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("longest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>("all");
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackData>>({});
  const [activeReviewCall, setActiveReviewCall] = useState<CallRecord | null>(null);
  const [visibleCount, setVisibleCount] = useState(25);

  // Load feedback from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bch_call_feedback_store");
      if (stored) {
        setFeedbackMap(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load local feedback:", e);
    }
  }, []);

  // Fetch calls data
  const fetchCalls = async (sync = false) => {
    if (sync) setIsSyncing(true);
    try {
      const res = await fetch(`/api/calls${sync ? "?sync=true" : ""}`);
      if (res.ok) {
        const json: CallsApiResponse = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load calls:", e);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const handleSaveFeedback = (feedback: FeedbackData) => {
    const updated = { ...feedbackMap, [feedback.call_id]: feedback };
    setFeedbackMap(updated);
    try {
      localStorage.setItem("bch_call_feedback_store", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
    // Also post to backend
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback),
    }).catch(console.error);
  };

  const reviewedCallsList = useMemo(() => {
    if (!data) return [];
    const reviewedIds = new Set(Object.keys(feedbackMap));
    return data.longest_calls.filter((c) => reviewedIds.has(c.id));
  }, [data, feedbackMap]);

  // Filtered Calls for Longest / Recent tabs
  const filteredCalls = useMemo(() => {
    if (!data) return [];
    let list = activeTab === "recent" ? data.recent_calls : data.longest_calls;

    if (activeTab === "reviewed") {
      list = reviewedCallsList;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().replace(/[^0-9]/g, "");
      list = list.filter((c) => c.from_number.replace(/[^0-9]/g, "").includes(q));
    }

    if (selectedTierFilter !== "all") {
      list = list.filter((c) => {
        const fb = feedbackMap[c.id];
        return fb?.lead_tier === selectedTierFilter;
      });
    }

    return list;
  }, [data, activeTab, searchQuery, selectedTierFilter, reviewedCallsList, feedbackMap]);

  // Filtered Repeat Callers
  const filteredGroups = useMemo(() => {
    if (!data) return [];
    let groups = data.caller_groups;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().replace(/[^0-9]/g, "");
      groups = groups.filter((g) => g.phone_number.replace(/[^0-9]/g, "").includes(q));
    }

    return groups;
  }, [data, searchQuery]);

  const exportFeedbackJSON = () => {
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(feedbackMap, null, 2));
    const dl = document.createElement("a");
    dl.setAttribute("href", jsonStr);
    dl.setAttribute("download", `bch_call_reviews_${new Date().toISOString().slice(0, 10)}.json`);
    dl.click();
  };

  return (
    <div className="max-w-xl mx-auto px-3.5 py-4 sm:px-4 sm:py-6 flex flex-col gap-4">
      {/* Top Mobile App Header */}
      <header className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-white text-lg tracking-tight">BCH Call Review</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE AUTO-CALL
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Line: +91 22 6423 1614 (Plivo)</p>
        </div>

        <button
          onClick={() => fetchCalls(true)}
          disabled={isSyncing}
          type="button"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold active:scale-95 transition-all"
          title="Sync fresh calls"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Sync</span>
        </button>
      </header>

      {/* Stats Summary Bar */}
      {data && (
        <StatsSummary
          totalCalls={data.total_calls}
          totalMinutes={data.total_duration_minutes}
          uniqueCallers={data.unique_callers_count}
          reviewedCount={Object.keys(feedbackMap).length}
        />
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search phone number (e.g. 8660, 9449)..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs text-slate-400 hover:text-white absolute right-3 top-1/2 -translate-y-1/2 px-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Tabs Row */}
      <div className="grid grid-cols-4 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
        <button
          onClick={() => {
            setActiveTab("longest");
            setVisibleCount(25);
          }}
          type="button"
          className={`py-2 rounded-lg transition-all text-center flex flex-col items-center gap-0.5 ${
            activeTab === "longest"
              ? "bg-emerald-600 text-white shadow-sm font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Longest</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("repeat");
            setVisibleCount(25);
          }}
          type="button"
          className={`py-2 rounded-lg transition-all text-center flex flex-col items-center gap-0.5 ${
            activeTab === "repeat"
              ? "bg-emerald-600 text-white shadow-sm font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Repeaters</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("recent");
            setVisibleCount(25);
          }}
          type="button"
          className={`py-2 rounded-lg transition-all text-center flex flex-col items-center gap-0.5 ${
            activeTab === "recent"
              ? "bg-emerald-600 text-white shadow-sm font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Recent</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("reviewed");
            setVisibleCount(25);
          }}
          type="button"
          className={`py-2 rounded-lg transition-all text-center flex flex-col items-center gap-0.5 relative ${
            activeTab === "reviewed"
              ? "bg-emerald-600 text-white shadow-sm font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Reviewed</span>
          {Object.keys(feedbackMap).length > 0 && (
            <span className="absolute top-1 right-2 px-1 rounded-full text-[9px] bg-amber-400 text-slate-950 font-bold">
              {Object.keys(feedbackMap).length}
            </span>
          )}
        </button>
      </div>

      {/* Subheader & Export action */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          {activeTab === "repeat"
            ? `Showing ${filteredGroups.length} repeat caller clusters`
            : `Showing ${Math.min(visibleCount, filteredCalls.length)} of ${filteredCalls.length} calls`}
        </span>

        {Object.keys(feedbackMap).length > 0 && (
          <button
            onClick={exportFeedbackJSON}
            type="button"
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Notes</span>
          </button>
        )}
      </div>

      {/* Content Feed */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-xs font-mono">Loading 615 call recordings...</p>
        </div>
      ) : activeTab === "repeat" ? (
        // Repeat Caller Groups View
        <div className="space-y-3">
          {filteredGroups.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No repeat callers match your search.</div>
          ) : (
            filteredGroups.slice(0, visibleCount).map((group, idx) => (
              <CallerGroupCard
                key={group.phone_number}
                group={group}
                rank={idx + 1}
                feedbackMap={feedbackMap}
                onOpenReview={(call) => setActiveReviewCall(call)}
              />
            ))
          )}

          {visibleCount < filteredGroups.length && (
            <button
              onClick={() => setVisibleCount((prev) => prev + 25)}
              type="button"
              className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Load More Callers ({filteredGroups.length - visibleCount} remaining)
            </button>
          )}
        </div>
      ) : (
        // Individual Calls View (Longest, Recent, Reviewed)
        <div className="space-y-3">
          {filteredCalls.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <HelpCircle className="w-6 h-6 text-slate-600" />
              <span>
                {activeTab === "reviewed"
                  ? "You haven't reviewed any calls yet. Tap 'Review Lead' on any call card to start!"
                  : "No calls found matching your query."}
              </span>
            </div>
          ) : (
            filteredCalls.slice(0, visibleCount).map((call, idx) => (
              <CallCard
                key={call.id}
                call={call}
                rank={activeTab === "longest" ? idx + 1 : undefined}
                feedback={feedbackMap[call.id]}
                onOpenReview={(call) => setActiveReviewCall(call)}
              />
            ))
          )}

          {visibleCount < filteredCalls.length && (
            <button
              onClick={() => setVisibleCount((prev) => prev + 25)}
              type="button"
              className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Load More Calls ({filteredCalls.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}

      {/* Review & Feedback Modal */}
      {activeReviewCall && (
        <ReviewFeedbackModal
          call={activeReviewCall}
          isOpen={!!activeReviewCall}
          onClose={() => setActiveReviewCall(null)}
          existingFeedback={feedbackMap[activeReviewCall.id]}
          onSaveFeedback={handleSaveFeedback}
        />
      )}
    </div>
  );
}
