import { CallRecord, CallerGroup, CallsApiResponse } from "./types";
import cachedCallsData from "../../data/calls_cache.json";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 0) {
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  }
  return `${s}s`;
}

function formatDate(isoOrPlivoTime: string): string {
  try {
    const d = new Date(isoOrPlivoTime);
    if (isNaN(d.getTime())) return isoOrPlivoTime.slice(0, 16);
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoOrPlivoTime.slice(0, 16);
  }
}

export function transformRawCall(raw: any, index: number): CallRecord {
  const durMs = parseFloat(raw.recording_duration_ms || raw.duration || 0);
  const durSec = durMs > 1000 ? durMs / 1000 : durMs;
  const rawFrom = String(raw.from_number || raw.caller || "Unknown").replace(/[^0-9]/g, "");
  const formattedPhone = rawFrom.startsWith("91") ? `+${rawFrom}` : `+91${rawFrom}`;
  const timestamp = raw.add_time || raw.created_at || new Date().toISOString();

  return {
    id: raw.call_uuid || raw.recording_id || `call-${index}`,
    recording_id: raw.recording_id || "",
    call_uuid: raw.call_uuid || "",
    from_number: formattedPhone,
    to_number: raw.to_number ? `+${String(raw.to_number).replace(/[^0-9]/g, "")}` : "+912264231614",
    duration_seconds: Math.round(durSec * 10) / 10,
    duration_ms: durMs,
    duration_formatted: formatDuration(durSec),
    recording_url: raw.recording_url || "",
    recording_format: (raw.recording_format || "mp3").toLowerCase(),
    timestamp,
    date_formatted: formatDate(timestamp),
    source: "plivo",
  };
}

export function processCalls(rawCalls: any[]): CallsApiResponse {
  const allCalls: CallRecord[] = rawCalls.map((r, i) => transformRawCall(r, i));

  // Sort by duration descending (longest first)
  const longestCalls = [...allCalls].sort((a, b) => b.duration_seconds - a.duration_seconds);

  // Group by phone number
  const groupMap = new Map<string, CallRecord[]>();
  for (const call of allCalls) {
    const num = call.from_number;
    if (!groupMap.has(num)) {
      groupMap.set(num, []);
    }
    groupMap.get(num)!.push(call);
  }

  const callerGroups: CallerGroup[] = Array.from(groupMap.entries()).map(([phone, calls]) => {
    // Sort calls for this caller newest first
    calls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const totalSec = calls.reduce((acc, c) => acc + c.duration_seconds, 0);
    const maxSec = Math.max(...calls.map((c) => c.duration_seconds));

    return {
      phone_number: phone,
      total_calls: calls.length,
      total_duration_seconds: Math.round(totalSec * 10) / 10,
      total_duration_formatted: formatDuration(totalSec),
      max_duration_seconds: Math.round(maxSec * 10) / 10,
      max_duration_formatted: formatDuration(maxSec),
      first_call_time: calls[calls.length - 1].date_formatted,
      last_call_time: calls[0].date_formatted,
      calls,
    };
  });

  // Sort caller groups by total calls descending, then total talk time
  callerGroups.sort((a, b) => {
    if (b.total_calls !== a.total_calls) {
      return b.total_calls - a.total_calls;
    }
    return b.total_duration_seconds - a.total_duration_seconds;
  });

  // Recent calls (newest first)
  const recentCalls = [...allCalls].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const totalDurationSec = allCalls.reduce((acc, c) => acc + c.duration_seconds, 0);

  return {
    total_calls: allCalls.length,
    total_duration_minutes: Math.round((totalDurationSec / 60) * 10) / 10,
    unique_callers_count: callerGroups.length,
    longest_calls: longestCalls,
    caller_groups: callerGroups,
    recent_calls: recentCalls,
  };
}

export function getCachedCalls(): CallsApiResponse {
  return processCalls(cachedCallsData as any[]);
}
