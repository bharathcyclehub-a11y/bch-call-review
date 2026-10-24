import { CallRecord, CallerGroup, CallsApiResponse, DroppedCall } from "./types";
import cachedPlivoCalls from "../../data/calls_cache.json";
import cachedBolnaCalls from "../../data/bolna_completed_cache.json";
import cachedDroppedCalls from "../../data/bolna_dropped_cache.json";

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

function cleanPhone(rawNumber: any): string {
  const digits = String(rawNumber || "Unknown").replace(/[^0-9]/g, "");
  if (!digits) return "+91Unknown";
  if (digits.startsWith("91") && digits.length >= 12) {
    return `+${digits}`;
  }
  return `+91${digits.slice(-10)}`;
}

export function transformBolnaCall(raw: any): CallRecord {
  const durSec = parseFloat(raw.conversation_duration || 0);
  const providerCallId = raw.telephony_data?.provider_call_id;
  const rawFrom = raw.user_number || raw.telephony_data?.from_number || "Unknown";
  const timestamp = raw.created_at || raw.initiated_at || new Date().toISOString();

  return {
    id: raw.id,
    lead_id: "", // Assigned chronologically
    recording_id: raw.id,
    call_uuid: providerCallId || raw.id,
    from_number: cleanPhone(rawFrom),
    to_number: "+912264231614",
    duration_seconds: Math.round(durSec * 10) / 10,
    duration_ms: durSec * 1000,
    duration_formatted: formatDuration(durSec),
    recording_url: `/api/audio?id=${raw.id}`,
    recording_format: "mp3",
    timestamp,
    date_formatted: formatDate(timestamp),
    source: "bolna",
    agent: "Bolna (Ananya)",
    transcript: typeof raw.transcript === "string" ? raw.transcript : undefined,
    summary: typeof raw.summary === "string" ? raw.summary : undefined,
    plivo_console_url: providerCallId
      ? `https://console.plivo.com/voice/logs/calls/${providerCallId}/`
      : undefined,
    hangup_reason: raw.telephony_data?.hangup_reason,
  };
}

export function transformPlivoCall(raw: any, index: number): CallRecord {
  const durMs = parseFloat(raw.recording_duration_ms || 0);
  const durSec = durMs > 0 ? durMs / 1000 : parseFloat(raw.rounded_recording_duration || raw.duration || 0);
  const rawFrom = raw.from_number || raw.caller || "Unknown";
  const timestamp = raw.add_time || raw.created_at || new Date().toISOString();
  const callUuid = raw.call_uuid || "";

  return {
    id: callUuid || raw.recording_id || `plivo-${index}`,
    lead_id: "", // Assigned chronologically
    recording_id: raw.recording_id || "",
    call_uuid: callUuid,
    from_number: cleanPhone(rawFrom),
    to_number: raw.to_number ? `+${String(raw.to_number).replace(/[^0-9]/g, "")}` : "+912264231614",
    duration_seconds: Math.round(durSec * 10) / 10,
    duration_ms: durMs,
    duration_formatted: formatDuration(durSec),
    recording_url: raw.recording_url || "",
    recording_format: (raw.recording_format || "mp3").toLowerCase(),
    timestamp,
    date_formatted: formatDate(timestamp),
    source: "plivo",
    agent: "AutoCall",
    plivo_console_url: callUuid
      ? `https://console.plivo.com/voice/logs/calls/${callUuid}/`
      : undefined,
  };
}

export function getAllUnifiedCalls(sourcePlivo: any[] = []): {
  calls: CallRecord[];
  dropped: DroppedCall[];
} {
  const plivoMap = new Map<string, any>();
  const basePlivo = sourcePlivo.length > 0 ? sourcePlivo : (cachedPlivoCalls as any[]);
  for (const c of basePlivo) {
    const key = c.call_uuid || c.recording_id;
    if (key) plivoMap.set(key, c);
  }

  // 2. Transform Bolna completed calls
  const unifiedMap = new Map<string, CallRecord>();
  const bolnaCalls = (cachedBolnaCalls as any[]).map(transformBolnaCall);

  for (const bCall of bolnaCalls) {
    if (bCall.call_uuid && plivoMap.has(bCall.call_uuid)) {
      const plivoRaw = plivoMap.get(bCall.call_uuid);
      if (plivoRaw.recording_url) {
        bCall.recording_url = plivoRaw.recording_url;
      }
      plivoMap.delete(bCall.call_uuid);
    }
    unifiedMap.set(bCall.id, bCall);
  }

  // 3. Add Plivo calls (handled by AutoCall)
  let idx = 0;
  for (const [_, raw] of plivoMap.entries()) {
    const pCall = transformPlivoCall(raw, idx++);
    unifiedMap.set(pCall.id, pCall);
  }

  // 4. Assign deterministic 4-digit Lead IDs (#1001, #1002...) chronologically
  const allCalls = Array.from(unifiedMap.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  allCalls.forEach((call, i) => {
    call.lead_id = `#${1001 + i}`;
  });

  // 5. Format dropped calls (balance-low)
  const dropped: DroppedCall[] = (cachedDroppedCalls as any[]).map((d: any) => ({
    id: d.id,
    phone_number: cleanPhone(d.user_number),
    timestamp: d.created_at,
    date_formatted: formatDate(d.created_at),
    reason: d.reason || "Bolna account wallet balance was low (-$0.02) - dropped before AI connected",
  }));

  return {
    calls: allCalls,
    dropped,
  };
}

export function processCalls(records: CallRecord[], dropped: DroppedCall[]): CallsApiResponse {
  // Sort by duration descending
  const longestCalls = [...records].sort((a, b) => b.duration_seconds - a.duration_seconds);

  // Group by phone number
  const groupMap = new Map<string, CallRecord[]>();
  for (const call of records) {
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
    const agents = Array.from(new Set(calls.map((c) => c.agent)));

    return {
      phone_number: phone,
      total_calls: calls.length,
      total_duration_seconds: Math.round(totalSec * 10) / 10,
      total_duration_formatted: formatDuration(totalSec),
      max_duration_seconds: Math.round(maxSec * 10) / 10,
      max_duration_formatted: formatDuration(maxSec),
      first_call_time: calls[calls.length - 1].date_formatted,
      last_call_time: calls[0].date_formatted,
      agents_seen: agents,
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
  const recentCalls = [...records].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const totalDurationSec = records.reduce((acc, c) => acc + c.duration_seconds, 0);
  const bolnaCount = records.filter((c) => c.agent === "Bolna (Ananya)").length;
  const autoCallCount = records.filter((c) => c.agent === "AutoCall").length;

  return {
    total_calls: records.length,
    total_duration_minutes: Math.round((totalDurationSec / 60) * 10) / 10,
    unique_callers_count: callerGroups.length,
    bolna_count: bolnaCount,
    autocall_count: autoCallCount,
    dropped_calls_count: dropped.length,
    dropped_calls_reason: "Bolna wallet balance was low (-$0.02) between Oct 20–21; calls dropped before AI agent connected.",
    dropped_callers: dropped,
    longest_calls: longestCalls,
    caller_groups: callerGroups,
    recent_calls: recentCalls,
  };
}

export function getCachedCalls(sourcePlivo: any[] = []): CallsApiResponse {
  const { calls, dropped } = getAllUnifiedCalls(sourcePlivo);
  return processCalls(calls, dropped);
}
