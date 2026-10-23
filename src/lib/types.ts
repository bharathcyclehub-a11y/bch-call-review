export type AgentType = "Bolna (Ananya)" | "AutoCall";

export interface CallRecord {
  id: string;
  recording_id: string;
  call_uuid: string;
  from_number: string;
  to_number: string;
  duration_seconds: number;
  duration_ms: number;
  duration_formatted: string;
  recording_url: string;
  recording_format: string;
  timestamp: string;
  date_formatted: string;
  source: "plivo" | "bolna";
  agent: AgentType;
  transcript?: string;
  summary?: string;
  plivo_console_url?: string;
  hangup_reason?: string;
}

export interface CallerGroup {
  phone_number: string;
  total_calls: number;
  total_duration_seconds: number;
  total_duration_formatted: string;
  max_duration_seconds: number;
  max_duration_formatted: string;
  first_call_time: string;
  last_call_time: string;
  agents_seen: AgentType[];
  calls: CallRecord[];
}

export type LeadTier = "hot" | "warm" | "cold" | "service" | "spam" | "unreviewed";

export interface FeedbackData {
  call_id: string;
  phone_number: string;
  lead_tier: LeadTier;
  agent_rating: number; // 1-5
  tags: string[]; // e.g. "Price Hallucination", "Interrupted Caller", "Script Glitch", "Great Empathy"
  customer_query: string; // What caller asked
  agent_response_notes: string; // How agent responded & what to fix
  general_notes: string; // Reviewer feedback
  reviewed_at: string;
  updated_at?: string;
  reviewed_by: string;
}

export interface DroppedCall {
  id: string;
  phone_number: string;
  timestamp: string;
  date_formatted: string;
  reason: string;
}

export interface CallsApiResponse {
  total_calls: number;
  total_duration_minutes: number;
  unique_callers_count: number;
  bolna_count: number;
  autocall_count: number;
  dropped_calls_count: number;
  dropped_calls_reason: string;
  dropped_callers: DroppedCall[];
  longest_calls: CallRecord[];
  caller_groups: CallerGroup[];
  recent_calls: CallRecord[];
}
