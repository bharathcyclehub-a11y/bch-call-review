"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Clock,
  Users,
  Download,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  X,
  Phone,
  MessageCircle,
  Bot,
  Radio,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { CallRecord, CallsApiResponse, FeedbackData, DroppedCall } from "@/lib/types";
import StatsSummary from "@/components/StatsSummary";
import CallCard from "@/components/CallCard";
import CallerGroupCard from "@/components/CallerGroupCard";
import ReviewFeedbackModal from "@/components/ReviewFeedbackModal";

type ActiveTab = "longest" | "repeat" | "recent" | "reviewed";
type AgentFilter = "all" | "Bolna (Ananya)" | "AutoCall";

export default function HomePage() {
  const [data, setData] = useState<CallsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("longest");
  const [selectedAgent, setSelectedAgent] = useState<AgentFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>("all");
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackData>>({});
  const [activeReviewCall, setActiveReviewCall] = useState<CallRecord | null>(null);
  const [visibleCount, setVisibleCount] = useState(25);
  const [showDroppedModal, setShowDroppedModal] = useState(false);
  const [droppedSearch, setDroppedSearch] = useState("");

  // Load feedback from localStorage & database on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bch_call_feedback_store");
      if (stored) {
        setFeedbackMap(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load local feedback:", e);
    }

    // Also fetch persisted feedback from database
    fetch("/api/feedback")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && Array.isArray(json.feedback) && json.feedback.length > 0) {
          setFeedbackMap((prev) => {
            const merged = { ...prev };
            for (const item of json.feedback) {
              if (item?.call_id) {
                merged[item.call_id] = item;
              }
            }
            try {
              localStorage.setItem("bch_call_feedback_store", JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      })
      .catch((e) => console.warn("Could not sync remote feedback on mount:", e));
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

  const reviewedCount = Object.keys(feedbackMap).length;
  const totalCalls = data?.total_calls || 0;
  const pendingCount = Math.max(0, totalCalls - reviewedCount);

  const reviewedCallsList = useMemo(() => {
    if (!data) return [];
    const reviewedIds = new Set(Object.keys(feedbackMap));
    return data.longest_calls.filter((c) => reviewedIds.has(c.id));
  }, [data, feedbackMap]);

  // Filtered Calls for Longest / Recent / Reviewed tabs
  const filteredCalls = useMemo(() => {
    if (!data) return [];
    let list: CallRecord[] = [];

    if (activeTab === "reviewed") {
      // Show ALL reviewed calls
      list = reviewedCallsList;
    } else if (activeTab === "longest") {
      // TASK QUEUE: Longest calls that are PENDING REVIEW (unreviewed)
      list = data.longest_calls.filter((c) => !feedbackMap[c.id]);
    } else if (activeTab === "recent") {
      // Recent calls that are PENDING REVIEW
      list = data.recent_calls.filter((c) => !feedbackMap[c.id]);
    } else {
      list = data.longest_calls;
    }

    // 1. Agent Filter
    if (selectedAgent !== "all") {
      list = list.filter((c) => c.agent === selectedAgent);
    }

    // 2. Phone Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().replace(/[^0-9]/g, "");
      list = list.filter((c) => c.from_number.replace(/[^0-9]/g, "").includes(q));
    }

    // 3. Lead Tier Filter
    if (selectedTierFilter !== "all") {
      list = list.filter((c) => {
        const fb = feedbackMap[c.id];
        return fb?.lead_tier === selectedTierFilter;
      });
    }

    return list;
  }, [data, activeTab, selectedAgent, searchQuery, selectedTierFilter, reviewedCallsList, feedbackMap]);

  // Filtered Repeat Callers
  const filteredGroups = useMemo(() => {
    if (!data) return [];
    let groups = data.caller_groups;

    if (selectedAgent !== "all") {
      groups = groups.filter((g) => g.agents_seen?.includes(selectedAgent as any));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().replace(/[^0-9]/g, "");
      groups = groups.filter((g) => g.phone_number.replace(/[^0-9]/g, "").includes(q));
    }

    return groups;
  }, [data, selectedAgent, searchQuery]);

  // Filtered Dropped Callers
  const filteredDropped = useMemo(() => {
    if (!data?.dropped_callers) return [];
    if (!droppedSearch.trim()) return data.dropped_callers;
    const q = droppedSearch.toLowerCase().replace(/[^0-9]/g, "");
    return data.dropped_callers.filter((d) => d.phone_number.replace(/[^0-9]/g, "").includes(q));
  }, [data, droppedSearch]);

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
          <p className="text-xs text-slate-400 font-mono mt-0.5">Line: +91 22 6423 1614 (Plivo & Bolna)</p>
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

      {/* Stats Summary Bar: Total, Pending Review (Task), Reviewed, Talk Time */}
      {data && (
        <StatsSummary
          totalCalls={data.total_calls}
          pendingCount={pendingCount}
          reviewedCount={reviewedCount}
          totalMinutes={data.total_duration_minutes}
          bolnaCount={data.bolna_count}
          autoCallCount={data.autocall_count}
        />
      )}

      {/* Dropped Calls Notice (Low Balance explanation) */}
      {data && data.dropped_calls_count > 0 && (
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 text-xs text-amber-200/90 flex items-start justify-between gap-3 shadow-inner">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">
                {data.dropped_calls_count} calls did not connect (Low Wallet Balance)
              </p>
              <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                Between Oct 20–21, Bolna credit was negative (-$0.02). These calls dropped before connecting and are excluded from audio review.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDroppedModal(true)}
            type="button"
            className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-semibold text-[11px] shrink-0 active:scale-95 transition-all"
          >
            View Numbers
          </button>
        </div>
      )}

      {/* Agent Filter Selector */}
      <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
        <button
          onClick={() => {
            setSelectedAgent("all");
            setVisibleCount(25);
          }}
          type="button"
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
            selectedAgent === "all"
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>All Agents</span>
          <span className="text-[10px] text-slate-500 font-mono">({data?.total_calls || 0})</span>
        </button>

        <button
          onClick={() => {
            setSelectedAgent("AutoCall");
            setVisibleCount(25);
          }}
          type="button"
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
            selectedAgent === "AutoCall"
              ? "bg-sky-600 text-white shadow-sm font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Radio className="w-3 h-3 text-sky-300" />
          <span>AutoCall</span>
          <span className="text-[10px] opacity-75 font-mono">({data?.autocall_count || 0})</span>
        </button>

        <button
          onClick={() => {
            setSelectedAgent("Bolna (Ananya)");
            setVisibleCount(25);
          }}
          type="button"
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
            selectedAgent === "Bolna (Ananya)"
              ? "bg-purple-600 text-white shadow-sm font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bot className="w-3 h-3 text-purple-300" />
          <span>Bolna</span>
          <span className="text-[10px] opacity-75 font-mono">({data?.bolna_count || 0})</span>
        </button>
      </div>

      {/* Search Input & Lead Tier Filter */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search phone number (e.g. 9449, 9008)..."
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

        {/* Lead Tier filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-medium no-scrollbar">
          {[
            { id: "all", label: "All Tiers" },
            { id: "hot", label: "🔥 Hot" },
            { id: "warm", label: "⚡ Warm" },
            { id: "kids", label: "🧒 Kids" },
            { id: "cold", label: "❄️ Cold" },
            { id: "service", label: "🛠️ Service" },
            { id: "spam", label: "🚫 Spam" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTierFilter(t.id)}
              className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-colors ${
                selectedTierFilter === t.id
                  ? "bg-slate-700 border-slate-500 text-white font-semibold"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task Queue Tabs: Longest (Pending), Repeaters, Recent (Pending), Reviewed */}
      <div className="grid grid-cols-4 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
        <button
          onClick={() => {
            setActiveTab("longest");
            setVisibleCount(25);
          }}
          type="button"
          className={`py-2 rounded-lg transition-all text-center flex flex-col items-center gap-0.5 relative ${
            activeTab === "longest"
              ? "bg-emerald-600 text-white shadow-sm font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Longest</span>
          <span className="text-[9px] opacity-80 font-mono">Pending</span>
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
          <span className="text-[9px] opacity-80 font-mono">Clusters</span>
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
          <span className="text-[9px] opacity-80 font-mono">Pending</span>
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
          {reviewedCount > 0 ? (
            <span className="px-1.5 rounded-full text-[9px] bg-amber-400 text-slate-950 font-bold">
              {reviewedCount}
            </span>
          ) : (
            <span className="text-[9px] opacity-80 font-mono">0</span>
          )}
        </button>
      </div>

      {/* Subheader & Task Count */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          {activeTab === "repeat"
            ? `Showing ${filteredGroups.length} repeat caller clusters`
            : activeTab === "reviewed"
            ? `Showing ${filteredCalls.length} reviewed calls`
            : `Showing ${Math.min(visibleCount, filteredCalls.length)} of ${filteredCalls.length} pending calls`}
        </span>

        {reviewedCount > 0 && (
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
          <p className="text-xs font-mono">Loading 1,112 call conversations...</p>
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
        // Individual Calls View (Longest Pending, Recent Pending, Reviewed)
        <div className="space-y-3">
          {filteredCalls.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              {activeTab === "longest" && pendingCount === 0 ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">All Longest Calls Reviewed!</span>
                  <span className="text-slate-400">Great job! You have cleared all pending longest calls.</span>
                </>
              ) : activeTab === "reviewed" ? (
                <>
                  <HelpCircle className="w-6 h-6 text-slate-600" />
                  <span>You haven't reviewed any calls yet. Tap 'Review Lead' on any call card to start!</span>
                </>
              ) : (
                <>
                  <HelpCircle className="w-6 h-6 text-slate-600" />
                  <span>No calls found matching your query.</span>
                </>
              )}
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

      {/* Dropped Callers Modal */}
      {showDroppedModal && data && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Dropped Calls (Low Balance)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {data.dropped_calls_count} callers between Oct 20–21 (Wallet was -$0.02)
                </p>
              </div>
              <button
                onClick={() => setShowDroppedModal(false)}
                type="button"
                className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search */}
            <div className="p-3 border-b border-slate-800 bg-slate-950/40">
              <input
                type="search"
                value={droppedSearch}
                onChange={(e) => setDroppedSearch(e.target.value)}
                placeholder="Search dropped caller number..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Dropped Callers List */}
            <div className="p-3 overflow-y-auto space-y-2 flex-1">
              {filteredDropped.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">No dropped callers match your search.</div>
              ) : (
                filteredDropped.slice(0, 50).map((d) => {
                  const clean = d.phone_number.replace(/[^0-9]/g, "");
                  const waUrl = `https://wa.me/${clean}?text=Hello!%20You%20recently%20tried%20calling%20Bharath%20Cycle%20Hub.%20Our%20line%20was%20busy%20at%20that%20moment.%20How%20can%20we%20assist%20you%20today?`;
                  return (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-white block">{d.phone_number}</span>
                        <span className="text-[10px] text-slate-500">{d.date_formatted}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-semibold text-[11px] flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3 fill-current" />
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={`tel:${d.phone_number}`}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-center text-[11px] text-slate-500">
              Showing {Math.min(50, filteredDropped.length)} of {filteredDropped.length} dropped callers
            </div>
          </div>
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
