export type AgentType = "Bolna (Ananya)" | "AutoCall";

export type LeadTier = "hot" | "warm" | "cold" | "unreviewed";

export interface CallRecord {
  id: string;
  lead_id: string; // 4-digit unique series e.g. "#1001", "#1002"
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

export interface FeedbackData {
  call_id: string;
  phone_number: string;
  lead_tier: LeadTier | string;
  agent_rating?: number;
  tags?: string[];
  feedback?: string;
  customer_query?: string;
  agent_response_notes?: string;
  general_notes?: string;
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
